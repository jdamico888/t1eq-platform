"use client";

import { useEffect, useMemo, useState } from "react";

import type { CompanyTool } from "@/types/company-tool";
import type { InventoryDiscrepancy } from "@/types/inventory-discrepancy";
import type { InventoryItem } from "@/types/inventory-item";
import type { PurchaseOrder } from "@/types/purchase-order";
import type { Truck } from "@/types/truck-stock";

import { getCompanyTools } from "@/services/company-tools";
import { getInventoryDiscrepancies } from "@/services/inventory-discrepancies";
import { getInventoryItems, getLowStockItems } from "@/services/inventory";
import { getPurchaseOrders } from "@/services/purchase-orders";
import { getTrucks } from "@/services/truck-stock";

import ArrangeableTileGrid, {
  type ArrangeableMenuItem,
} from "@/components/dashboard/ArrangeableTileGrid";
import {
  DASHBOARD_LAYOUT_CHANGED_EVENT,
  arrangeDashboardTiles,
  createEmptySectionLayout,
  getDashboardSectionLayout,
  hideDashboardTile,
  resetDashboardSectionLayout,
  saveDashboardSectionOrder,
  showDashboardTile,
  type DashboardSectionLayout,
} from "@/services/dashboard-layout";

type DashboardTileTone = "Normal" | "Attention" | "Warning" | "Good";

type DashboardTileMetric = {
  label: string;
  value: string | number;
};

type DashboardCategoryTile = {
  id: string;
  title: string;
  description: string;
  href: string;
  metrics: DashboardTileMetric[];
  tone?: DashboardTileTone;
};

type LocalCounts = {
  repairOrders: number;
  openRepairOrders: number;
  completedRepairOrders: number;
  waitingPartsRepairOrders: number;
  dispatchJobs: number;
  activeDispatchJobs: number;
  invoices: number;
  openInvoices: number;
  paidInvoices: number;
  customers: number;
  equipment: number;
  suppliers: number;
  users: number;
};

const QBIT_SCOPE = "operations-dashboard";

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";

const pageHeaderClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";

const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";

const dashboardGridClass =
  "grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

const baseTileClass =
  "flex h-full min-h-[250px] flex-col rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md";

const normalTileClass =
  `${baseTileClass} border-zinc-200 bg-white hover:border-zinc-400`;

const attentionTileClass =
  `${baseTileClass} border-orange-300 bg-orange-50 hover:border-orange-500`;

const warningTileClass =
  `${baseTileClass} border-red-300 bg-red-50 hover:border-red-500`;

const goodTileClass =
  `${baseTileClass} border-green-300 bg-green-50 hover:border-green-500`;

const linkButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-black shadow-sm transition hover:bg-zinc-50";

const metricBoxClass =
  "rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm";

function getTileClass(tone: DashboardTileTone = "Normal") {
  if (tone === "Warning") {
    return warningTileClass;
  }

  if (tone === "Attention") {
    return attentionTileClass;
  }

  if (tone === "Good") {
    return goodTileClass;
  }

  return normalTileClass;
}

function safeReadLocalStorageArray(key: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue;
  } catch {
    return [];
  }
}

function getStatusValue(record: unknown) {
  if (!record || typeof record !== "object") {
    return "";
  }

  const possibleRecord = record as {
    status?: unknown;
    repairOrderStatus?: unknown;
    invoiceStatus?: unknown;
    dispatchStatus?: unknown;
  };

  const status =
    possibleRecord.status ??
    possibleRecord.repairOrderStatus ??
    possibleRecord.invoiceStatus ??
    possibleRecord.dispatchStatus ??
    "";

  return typeof status === "string" ? status : "";
}

function statusIsOpen(status: string) {
  return ![
    "Completed",
    "Closed",
    "Invoiced",
    "Paid",
    "Cancelled",
    "Canceled",
    "Resolved",
    "Dismissed",
  ].includes(status);
}

function statusMatches(status: string, targetStatuses: string[]) {
  return targetStatuses.includes(status);
}

function loadLocalCounts(): LocalCounts {
  const repairOrders = safeReadLocalStorageArray("t1eq-repair-orders");
  const dispatchJobs = safeReadLocalStorageArray("t1eq-dispatch-jobs");
  const invoices = safeReadLocalStorageArray("t1eq-invoices");
  const customers = safeReadLocalStorageArray("t1eq-customers");
  const equipment = safeReadLocalStorageArray("t1eq-equipment");
  const suppliers = safeReadLocalStorageArray("t1eq-suppliers");
  const users = safeReadLocalStorageArray("t1eq-users");

  return {
    repairOrders: repairOrders.length,
    openRepairOrders: repairOrders.filter((record) =>
      statusIsOpen(getStatusValue(record))
    ).length,
    completedRepairOrders: repairOrders.filter((record) =>
      statusMatches(getStatusValue(record), ["Completed", "Closed", "Invoiced"])
    ).length,
    waitingPartsRepairOrders: repairOrders.filter((record) =>
      statusMatches(getStatusValue(record), ["Waiting Parts"])
    ).length,
    dispatchJobs: dispatchJobs.length,
    activeDispatchJobs: dispatchJobs.filter((record) =>
      statusIsOpen(getStatusValue(record))
    ).length,
    invoices: invoices.length,
    openInvoices: invoices.filter((record) =>
      statusIsOpen(getStatusValue(record))
    ).length,
    paidInvoices: invoices.filter((record) =>
      statusMatches(getStatusValue(record), ["Paid", "Closed"])
    ).length,
    customers: customers.length,
    equipment: equipment.length,
    suppliers: suppliers.length,
    users: users.length,
  };
}

function isOpenPurchaseOrder(purchaseOrder: PurchaseOrder) {
  return ["Draft", "Open", "Ordered", "Partially Received"].includes(
    purchaseOrder.status
  );
}

function isReceivedPurchaseOrder(purchaseOrder: PurchaseOrder) {
  return purchaseOrder.status === "Received";
}

function isDraftPurchaseOrder(purchaseOrder: PurchaseOrder) {
  return purchaseOrder.status === "Draft";
}

function isOrderedPurchaseOrder(purchaseOrder: PurchaseOrder) {
  return purchaseOrder.status === "Ordered";
}

function isOpenInventoryDiscrepancy(discrepancy: InventoryDiscrepancy) {
  return (
    discrepancy.status === "Open" || discrepancy.status === "Under Review"
  );
}

function isAvailableTool(tool: CompanyTool) {
  return tool.status === "Available";
}

function isAssignedTool(tool: CompanyTool) {
  return tool.status === "Assigned";
}

function DashboardCategoryCard({
  id,
  title,
  description,
  href,
  metrics,
  tone = "Normal",
}: DashboardCategoryTile) {
  const qbitId = `operations-dashboard-category-${id}`;

  return (
    <a
      href={href}
      data-t1eq-tile="true"
      data-t1eq-page-card="true"
      data-t1eq-qbit-type="tile"
      data-t1eq-qbit-id={qbitId}
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className={getTileClass(tone)}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">
            Operations Area
          </div>

          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id={`${qbitId}-title`}
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-2 text-2xl font-black text-black"
          >
            {title}
          </h2>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id={`${qbitId}-status-badge`}
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-600">
          Open
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className={metricBoxClass}>
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500">
              {metric.label}
            </div>

            <div className="mt-1 text-2xl font-black text-black">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-zinc-600">
        {description}
      </p>

      <div className="mt-auto pt-5">
        <div data-t1eq-tile="true" data-t1eq-page-card="true"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-id={`${qbitId}-open`}
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-black text-black shadow-sm">
          Open {title}
        </div>
      </div>
    </a>
  );
}

export default function OperationsDashboardPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [inventoryDiscrepancies, setInventoryDiscrepancies] = useState<
    InventoryDiscrepancy[]
  >([]);
  const [companyTools, setCompanyTools] = useState<CompanyTool[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [localCounts, setLocalCounts] = useState<LocalCounts>({
    repairOrders: 0,
    openRepairOrders: 0,
    completedRepairOrders: 0,
    waitingPartsRepairOrders: 0,
    dispatchJobs: 0,
    activeDispatchJobs: 0,
    invoices: 0,
    openInvoices: 0,
    paidInvoices: 0,
    customers: 0,
    equipment: 0,
    suppliers: 0,
    users: 0,
  });

  /*
   * How the person has arranged the category tiles. Empty until the effect
   * below reads it, so the first client render matches what the server
   * rendered and hydration stays quiet.
   */
  const [categoryTileLayout, setCategoryTileLayout] =
    useState<DashboardSectionLayout>(createEmptySectionLayout);

  useEffect(() => {
    setPurchaseOrders(getPurchaseOrders());
    setInventoryItems(getInventoryItems());
    setLowStockItems(getLowStockItems());
    setInventoryDiscrepancies(getInventoryDiscrepancies());
    setCompanyTools(getCompanyTools());
    setTrucks(getTrucks());
    setLocalCounts(loadLocalCounts());

    function loadCategoryTileLayout() {
      setCategoryTileLayout(getDashboardSectionLayout("categoryTiles"));
    }

    loadCategoryTileLayout();

    /* Keeps a second tab in step after a drag. */
    window.addEventListener(
      DASHBOARD_LAYOUT_CHANGED_EVENT,
      loadCategoryTileLayout
    );

    window.addEventListener("storage", loadCategoryTileLayout);

    return () => {
      window.removeEventListener(
        DASHBOARD_LAYOUT_CHANGED_EVENT,
        loadCategoryTileLayout
      );

      window.removeEventListener("storage", loadCategoryTileLayout);
    };
  }, []);

  const openPurchaseOrders = useMemo(
    () => purchaseOrders.filter(isOpenPurchaseOrder),
    [purchaseOrders]
  );

  const draftPurchaseOrders = useMemo(
    () => purchaseOrders.filter(isDraftPurchaseOrder),
    [purchaseOrders]
  );

  const orderedPurchaseOrders = useMemo(
    () => purchaseOrders.filter(isOrderedPurchaseOrder),
    [purchaseOrders]
  );

  const receivedPurchaseOrders = useMemo(
    () => purchaseOrders.filter(isReceivedPurchaseOrder),
    [purchaseOrders]
  );

  const openInventoryDiscrepancies = useMemo(
    () => inventoryDiscrepancies.filter(isOpenInventoryDiscrepancy),
    [inventoryDiscrepancies]
  );

  const availableTools = useMemo(
    () => companyTools.filter(isAvailableTool),
    [companyTools]
  );

  const assignedTools = useMemo(
    () => companyTools.filter(isAssignedTool),
    [companyTools]
  );

  const dashboardCategories: DashboardCategoryTile[] = [
    {
      id: "repair-orders",
      title: "Repair Orders",
      description:
        "Active repair workflow from customer complaint through technician action items, parts, labor, signature, and invoice handoff.",
      href: "/repair-orders",
      tone: localCounts.openRepairOrders > 0 ? "Attention" : "Good",
      metrics: [
        { label: "Total", value: localCounts.repairOrders },
        { label: "Open", value: localCounts.openRepairOrders },
        { label: "Waiting Parts", value: localCounts.waitingPartsRepairOrders },
        { label: "Completed", value: localCounts.completedRepairOrders },
      ],
    },
    {
      id: "dispatch",
      title: "Dispatch",
      description:
        "Field movement, technician assignment, route status, urgent calls, waiting parts, and customer arrival workflow.",
      href: "/dispatch",
      tone: localCounts.activeDispatchJobs > 0 ? "Attention" : "Normal",
      metrics: [
        { label: "Total", value: localCounts.dispatchJobs },
        { label: "Active", value: localCounts.activeDispatchJobs },
        { label: "Routes", value: localCounts.dispatchJobs },
        { label: "Techs", value: localCounts.users },
      ],
    },
    {
      id: "invoicing",
      title: "Invoicing",
      description:
        "Billing status, repair order charges, parts totals, labor totals, customer invoice creation, and payment closure.",
      href: "/invoices",
      tone: localCounts.openInvoices > 0 ? "Attention" : "Good",
      metrics: [
        { label: "Total", value: localCounts.invoices },
        { label: "Open", value: localCounts.openInvoices },
        { label: "Paid", value: localCounts.paidInvoices },
        { label: "RO Billing", value: localCounts.completedRepairOrders },
      ],
    },
    {
      id: "inventory",
      title: "Inventory",
      description:
        "Stocked parts, receiving, tools, inventory transactions, discrepancies, truck stock, and mobile inventory movement.",
      href: "/inventory",
      tone:
        lowStockItems.length > 0 || openInventoryDiscrepancies.length > 0
          ? "Warning"
          : "Good",
      metrics: [
        { label: "Items", value: inventoryItems.length },
        { label: "Low Stock", value: lowStockItems.length },
        { label: "Discrep.", value: openInventoryDiscrepancies.length },
        { label: "Tools", value: companyTools.length },
      ],
    },
    {
      id: "purchase-orders",
      title: "Purchase Orders",
      description:
        "Purchasing from supplier order through receiving, warehouse stock, truck stock, direct-charge RO parts, and cost control.",
      href: "/purchase-orders",
      tone: openPurchaseOrders.length > 0 ? "Attention" : "Good",
      metrics: [
        { label: "Total", value: purchaseOrders.length },
        { label: "Open", value: openPurchaseOrders.length },
        { label: "Ordered", value: orderedPurchaseOrders.length },
        { label: "Received", value: receivedPurchaseOrders.length },
      ],
    },
    {
      id: "accounting",
      title: "Accounting",
      description:
        "Invoicing, payroll, purchase orders, supplier spend, technician pay, labor cost, parts cost, and accounting review.",
      href: "/invoices",
      tone: localCounts.openInvoices > 0 ? "Attention" : "Normal",
      metrics: [
        { label: "Invoices", value: localCounts.invoices },
        { label: "Open Inv.", value: localCounts.openInvoices },
        { label: "POs", value: purchaseOrders.length },
        { label: "Payroll", value: "Pay" },
      ],
    },
    {
      id: "customers",
      title: "Customers",
      description:
        "Customer records, service locations, site addresses, equipment ownership, repair history, and billing relationships.",
      href: "/customers",
      metrics: [
        { label: "Customers", value: localCounts.customers },
        { label: "Equipment", value: localCounts.equipment },
        { label: "ROs", value: localCounts.repairOrders },
        { label: "Invoices", value: localCounts.invoices },
      ],
    },
    {
      id: "equipment",
      title: "Equipment",
      description:
        "Customer equipment, model and serial data, service history, inspection records, repair orders, photos, and asset movement.",
      href: "/equipment",
      metrics: [
        { label: "Assets", value: localCounts.equipment },
        { label: "Customers", value: localCounts.customers },
        { label: "ROs", value: localCounts.repairOrders },
        { label: "Photos", value: "Req." },
      ],
    },
    {
      id: "scheduling",
      title: "Scheduling",
      description:
        "Technician workload, recurring service, field appointments, customer commitments, dispatch preparation, and capacity.",
      href: "/scheduling",
      metrics: [
        { label: "Calendar", value: "Plan" },
        { label: "Dispatch", value: localCounts.dispatchJobs },
        { label: "Techs", value: localCounts.users },
        { label: "Open ROs", value: localCounts.openRepairOrders },
      ],
    },
    {
      id: "payroll",
      title: "Payroll",
      description:
        "Technician labor entries, flat-rate work, mileage, hourly time, completed jobs, and payroll approval.",
      href: "/payroll",
      metrics: [
        { label: "Users", value: localCounts.users },
        { label: "Open ROs", value: localCounts.openRepairOrders },
        { label: "Completed", value: localCounts.completedRepairOrders },
        { label: "Mileage", value: "Track" },
      ],
    },
    {
      id: "suppliers",
      title: "Suppliers",
      description:
        "Vendors, parts sources, purchase order suppliers, pricing history, and procurement relationships.",
      href: "/suppliers",
      metrics: [
        { label: "Suppliers", value: localCounts.suppliers },
        { label: "POs", value: purchaseOrders.length },
        { label: "Open POs", value: openPurchaseOrders.length },
        { label: "Drafts", value: draftPurchaseOrders.length },
      ],
    },
    {
      id: "users",
      title: "Users",
      description:
        "Technicians, owner access, office users, tax users, future inspectors, permissions, and role-based workflows.",
      href: "/users",
      metrics: [
        { label: "Users", value: localCounts.users },
        { label: "Dispatch", value: localCounts.dispatchJobs },
        { label: "Payroll", value: "Pay" },
        { label: "Roles", value: "Access" },
      ],
    },
  ];

  const arrangedCategoryTiles = arrangeDashboardTiles(
    dashboardCategories,
    (category) => category.id,
    categoryTileLayout
  );

  /*
   * The trash takes a tile off the dashboard; it does not delete anything.
   * Every removed tile is listed in the right-click picker, so a tile is
   * always one press away from coming back.
   */
  function handleReorderCategoryTiles(orderedIds: string[]) {
    setCategoryTileLayout(
      saveDashboardSectionOrder("categoryTiles", orderedIds)
    );
  }

  function handleRemoveCategoryTile(tileId: string) {
    setCategoryTileLayout(hideDashboardTile("categoryTiles", tileId));
  }

  const hasCategoryTileLayout =
    categoryTileLayout.order.length > 0 ||
    categoryTileLayout.hidden.length > 0;

  const categoryTilePickerItems: ArrangeableMenuItem[] = [
    ...arrangedCategoryTiles.hidden.map((category) => ({
      label: `Add: ${category.title}`,
      description: "Put this tile back on the dashboard.",
      onSelect: () =>
        setCategoryTileLayout(
          showDashboardTile("categoryTiles", category.id)
        ),
    })),

    ...(hasCategoryTileLayout
      ? [
          {
            label: "Reset Category Tiles",
            description: "Return every tile to its original place.",
            onSelect: () =>
              setCategoryTileLayout(
                resetDashboardSectionLayout("categoryTiles")
              ),
          },
        ]
      : []),
  ];

  return (
    <div className={pageClass}>
      <header data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="operations-dashboard-header"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className={pageHeaderClass}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="operations-dashboard-overline"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="text-sm font-black uppercase tracking-wide text-zinc-500"
            >
              Tier One Equipment
            </p>

            <h1
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="operations-dashboard-title"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 text-4xl font-black text-black"
            >
              Operations Dashboard
            </h1>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="operations-dashboard-description"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="mt-2 max-w-4xl text-base font-semibold text-zinc-600"
            >
              At-a-glance command center for the key operational areas of the
              business. Each equal-size tile shows multiple live status values
              and opens the category main menu when clicked.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/repair-orders"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="operations-dashboard-quicklink-repair-orders"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={linkButtonClass}
            >
              Repair Orders
            </a>

            <a href="/dispatch"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="operations-dashboard-quicklink-dispatch"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={linkButtonClass}
            >
              Dispatch
            </a>

            <a href="/invoices"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="operations-dashboard-quicklink-invoices"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={linkButtonClass}
            >
              Invoices
            </a>

            <a href="/inventory"
              data-t1eq-qbit-type="action-button"
              data-t1eq-qbit-id="operations-dashboard-quicklink-inventory"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={linkButtonClass}
            >
              Inventory
            </a>
          </div>
        </div>
      </header>

      <section data-t1eq-page-card="true"
        data-t1eq-qbit-type="page-card"
        data-t1eq-qbit-id="operations-dashboard-categories"
        data-t1eq-qbit-scope={QBIT_SCOPE}
        className={sectionClass}>
        <div className="mb-5">
          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="operations-dashboard-categories-overline"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="text-sm font-black uppercase tracking-wide text-zinc-500"
          >
            Command Center
          </p>

          <h2
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="operations-dashboard-categories-title"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-1 text-2xl font-black text-black"
          >
            Operational Category Tiles
          </h2>

          <p
            data-t1eq-qbit-type="text"
            data-t1eq-qbit-id="operations-dashboard-categories-description"
            data-t1eq-qbit-scope={QBIT_SCOPE}
            className="mt-1 text-sm font-semibold text-zinc-600"
          >
            Click any tile to open that category’s main menu. Drag to
            arrange, drag to the trash to remove, right-click to add back.
          </p>
        </div>

        <ArrangeableTileGrid
          allowLinkDrag
          qbitId="operations-dashboard-tile-grid"
          qbitScope={QBIT_SCOPE}
          gridClassName={dashboardGridClass}
          tiles={arrangedCategoryTiles.visible.map((category) => ({
            id: category.id,
            content: <DashboardCategoryCard {...category} />,
          }))}
          onReorder={handleReorderCategoryTiles}
          onRemove={handleRemoveCategoryTile}
          menuItems={categoryTilePickerItems}
          emptyState={
            <div
              data-t1eq-page-card="true"
              data-t1eq-qbit-type="page-card"
              data-t1eq-qbit-id="operations-dashboard-tile-grid-empty"
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center"
            >
              <p className="text-sm font-black text-black">
                No category tiles on the dashboard.
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-600">
                Right-click here to put them back. Nothing was deleted.
              </p>
            </div>
          }
        />
      </section>
    </div>
  );
}