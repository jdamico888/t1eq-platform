"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAppearanceSettings } from "@/services/appearance-settings";

type StoredRecord = Record<string, unknown>;

type DashboardMetrics = {
  customers: number;
  equipment: number;
  repairOrders: number;
  openRepairOrders: number;
  inventory: number;
  lowInventory: number;
  trucks: number;
  purchaseOrders: number;
  invoices: number;
};

type DashboardSubcategory = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type DashboardTileDefinition = {
  id: string;
  label: string;
  metricKey: keyof DashboardMetrics;
  description: string;
  href: string;
  accentClass: string;
  subcategories: DashboardSubcategory[];
};

type DisplaySubcategory = DashboardSubcategory & {
  value: number;
};

type SelectedSubcategoryMap = Record<string, string[]>;
type SubcategoryValueMap = Record<string, Record<string, number>>;

const DASHBOARD_SUBCATEGORY_STORAGE_KEY =
  "t1eq-dashboard-tile-subcategories-v4";

const MAX_VISIBLE_SUBCATEGORIES = 3;

const DEFAULT_METRICS: DashboardMetrics = {
  customers: 0,
  equipment: 0,
  repairOrders: 0,
  openRepairOrders: 0,
  inventory: 0,
  lowInventory: 0,
  trucks: 0,
  purchaseOrders: 0,
  invoices: 0,
};

const DASHBOARD_TILE_DEFINITIONS: DashboardTileDefinition[] = [
  {
    id: "customers",
    label: "Customers",
    metricKey: "customers",
    href: "/customers",
    accentClass: "bg-orange-500",
    description:
      "Customer account records, billing information, contact details, service locations, and account-level service history.",
    subcategories: [
      {
        id: "accounts",
        label: "Accounts",
        description: "Customer account records and billing profiles.",
        href: "/customers",
      },
      {
        id: "contacts",
        label: "Contacts",
        description: "Customer contact names, phone numbers, and emails.",
        href: "/customers",
      },
      {
        id: "locations",
        label: "Locations",
        description: "Customer service locations and site records.",
        href: "/customers",
      },
      {
        id: "history",
        label: "History",
        description: "Customer service and repair-order history.",
        href: "/customers",
      },
    ],
  },
  {
    id: "equipment",
    label: "Equipment",
    metricKey: "equipment",
    href: "/equipment",
    accentClass: "bg-cyan-500",
    description:
      "Customer-owned equipment records, model and serial data, location assignment, service history, and inspection readiness.",
    subcategories: [
      {
        id: "assets",
        label: "Assets",
        description: "Equipment asset records by customer.",
        href: "/equipment",
      },
      {
        id: "model-serial",
        label: "Model / Serial",
        description: "Model, serial, manufacturer, and asset tags.",
        href: "/equipment",
      },
      {
        id: "locations",
        label: "Locations",
        description: "Current equipment site or service location.",
        href: "/equipment",
      },
      {
        id: "service-history",
        label: "Service History",
        description: "Repair and inspection history for each asset.",
        href: "/equipment",
      },
    ],
  },
  {
    id: "repair-orders",
    label: "Repair Orders",
    metricKey: "repairOrders",
    href: "/repair-orders",
    accentClass: "bg-emerald-500",
    description:
      "Full repair-order workflow for customer concern, diagnosis, labor, parts, technician assignment, photos, signatures, and closeout.",
    subcategories: [
      {
        id: "open",
        label: "Open",
        description: "Active repair orders not yet completed or closed.",
        href: "/repair-orders",
      },
      {
        id: "diagnosis",
        label: "Diagnosis",
        description: "Repair orders or action items with diagnostic workflow.",
        href: "/repair-orders",
      },
      {
        id: "labor",
        label: "Labor",
        description: "Labor entries, rates, hours, and technician work.",
        href: "/repair-orders",
      },
      {
        id: "parts",
        label: "Parts",
        description: "Parts required, used, sold, or attached to the RO.",
        href: "/repair-orders",
      },
      {
        id: "photos",
        label: "Photos",
        description: "Model/serial, before, after, and completion photos.",
        href: "/repair-orders",
      },
    ],
  },
  {
    id: "open-repair-orders",
    label: "Open ROs",
    metricKey: "openRepairOrders",
    href: "/repair-orders",
    accentClass: "bg-red-500",
    description:
      "Repair orders that are still active and have not reached completed, closed, invoiced, or cancelled status.",
    subcategories: [
      {
        id: "scheduled",
        label: "Scheduled",
        description: "Open repair orders already scheduled for service.",
        href: "/repair-orders",
      },
      {
        id: "in-progress",
        label: "In Progress",
        description: "Repair orders with active field or shop work.",
        href: "/repair-orders",
      },
      {
        id: "waiting-parts",
        label: "Waiting Parts",
        description: "Repair orders delayed by parts availability.",
        href: "/repair-orders",
      },
      {
        id: "waiting-approval",
        label: "Waiting Approval",
        description: "Repair orders waiting for customer authorization.",
        href: "/repair-orders",
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    metricKey: "inventory",
    href: "/inventory",
    accentClass: "bg-violet-500",
    description:
      "Warehouse inventory, part lookup, images, cross references, quantity tracking, cost, sell price, and transaction history.",
    subcategories: [
      {
        id: "warehouse",
        label: "Warehouse",
        description: "Main warehouse stock records.",
        href: "/inventory",
      },
      {
        id: "part-lookup",
        label: "Part Lookup",
        description: "Part numbers, descriptions, and cross references.",
        href: "/inventory",
      },
      {
        id: "transactions",
        label: "Transactions",
        description: "Receipts, usage, returns, adjustments, and transfers.",
        href: "/inventory/transactions",
      },
      {
        id: "pricing",
        label: "Pricing",
        description: "Cost, sell price, margin, and billing values.",
        href: "/inventory",
      },
    ],
  },
  {
    id: "low-inventory",
    label: "Low Inventory",
    metricKey: "lowInventory",
    href: "/inventory",
    accentClass: "bg-rose-500",
    description:
      "Inventory items at or below minimum stock thresholds that may need replenishment or purchase-order review.",
    subcategories: [
      {
        id: "reorder",
        label: "Reorder",
        description: "Items that need replenishment.",
        href: "/inventory",
      },
      {
        id: "minimums",
        label: "Minimums",
        description: "Minimum quantity and reorder-point tracking.",
        href: "/inventory",
      },
      {
        id: "supplier-review",
        label: "Supplier Review",
        description: "Low-stock items that may need supplier review.",
        href: "/purchase-orders",
      },
      {
        id: "truck-shortage",
        label: "Truck Shortage",
        description: "Field stock shortages requiring transfer or purchase.",
        href: "/truck-stock",
      },
    ],
  },
  {
    id: "truck-stock",
    label: "Truck Stock",
    metricKey: "trucks",
    href: "/truck-stock",
    accentClass: "bg-sky-500",
    description:
      "Field truck inventory, warehouse-to-truck transfer, truck-level stock tracking, technician assignment, and field replenishment.",
    subcategories: [
      {
        id: "trucks",
        label: "Trucks",
        description: "Service truck records and assigned inventory.",
        href: "/truck-stock",
      },
      {
        id: "technicians",
        label: "Technicians",
        description: "Technician-to-truck assignment.",
        href: "/truck-stock",
      },
      {
        id: "transfers",
        label: "Transfers",
        description: "Warehouse-to-truck and truck-to-warehouse movement.",
        href: "/truck-stock",
      },
      {
        id: "field-stock",
        label: "Field Stock",
        description: "Inventory available on service vehicles.",
        href: "/truck-stock",
      },
    ],
  },
  {
    id: "purchase-orders",
    label: "Purchase Orders",
    metricKey: "purchaseOrders",
    href: "/purchase-orders",
    accentClass: "bg-amber-500",
    description:
      "Supplier purchasing workflow, order lines, receiving, inventory replenishment, discrepancy review, and procurement status.",
    subcategories: [
      {
        id: "suppliers",
        label: "Suppliers",
        description: "Supplier records and purchasing relationships.",
        href: "/suppliers",
      },
      {
        id: "orders",
        label: "Orders",
        description: "Purchase-order headers and line items.",
        href: "/purchase-orders",
      },
      {
        id: "receiving",
        label: "Receiving",
        description: "Incoming parts and received quantities.",
        href: "/purchase-orders",
      },
      {
        id: "discrepancies",
        label: "Discrepancies",
        description: "Purchase-order shortages, overages, and mismatches.",
        href: "/purchase-orders",
      },
    ],
  },
  {
    id: "invoices",
    label: "Invoices",
    metricKey: "invoices",
    href: "/invoices",
    accentClass: "bg-green-500",
    description:
      "Customer invoice records generated from repair-order billing, labor, parts, other charges, and invoice status.",
    subcategories: [
      {
        id: "drafts",
        label: "Drafts",
        description: "Invoices not yet issued to customers.",
        href: "/invoices",
      },
      {
        id: "issued",
        label: "Issued",
        description: "Invoices sent or ready for customer review.",
        href: "/invoices",
      },
      {
        id: "repair-order-billing",
        label: "RO Billing",
        description: "Invoices generated from repair-order labor and parts.",
        href: "/invoices",
      },
      {
        id: "paid",
        label: "Paid",
        description: "Invoices marked paid or completed.",
        href: "/invoices",
      },
    ],
  },
];

function readArrayFromStorage(keys: string[]): StoredRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  for (const key of keys) {
    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      const parsedValue = JSON.parse(storedValue);

      if (Array.isArray(parsedValue)) {
        return parsedValue.filter(
          (item): item is StoredRecord =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item)
        );
      }
    } catch {
      continue;
    }
  }

  return [];
}


function getText(record: StoredRecord, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function getNumber(record: StoredRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const parsedValue = Number(record[key]);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function hasAnyText(record: StoredRecord, keys: string[]): boolean {
  return getText(record, keys).length > 0;
}

function countNestedArrays(records: StoredRecord[], keys: string[]): number {
  return records.reduce((total, record) => {
    return (
      total +
      keys.reduce((nestedTotal, key) => {
        const value = record[key];

        return Array.isArray(value) ? nestedTotal + value.length : nestedTotal;
      }, 0)
    );
  }, 0);
}

function getStatus(record: StoredRecord): string {
  return getText(record, [
    "status",
    "repairOrderStatus",
    "invoiceStatus",
  ]).toLowerCase();
}

function countByStatus(records: StoredRecord[], statuses: string[]): number {
  return records.filter((record) => statuses.includes(getStatus(record))).length;
}

function statusIncludes(record: StoredRecord, statusText: string): boolean {
  return getStatus(record).includes(statusText);
}

function isClosedRepairOrder(repairOrder: StoredRecord): boolean {
  const status = getStatus(repairOrder);

  return (
    status === "completed" ||
    status === "closed" ||
    status === "invoiced" ||
    status === "cancelled"
  );
}

function hasActionType(repairOrder: StoredRecord, actionType: string): boolean {
  const actionItems = repairOrder.actionItems;

  if (!Array.isArray(actionItems)) {
    return false;
  }

  return actionItems.some((actionItem) => {
    if (
      !actionItem ||
      typeof actionItem !== "object" ||
      Array.isArray(actionItem)
    ) {
      return false;
    }

    const actionItemRecord = actionItem as StoredRecord;

    return getText(actionItemRecord, ["type", "title"])
      .toLowerCase()
      .includes(actionType);
  });
}

function readDashboardData() {
  return {
    customers: readArrayFromStorage(["t1eq-customers", "customers"]),
    equipment: readArrayFromStorage([
      "t1eq-equipment",
      "t1eq-equipment-items",
      "equipment",
    ]),
    repairOrders: readArrayFromStorage([
      "t1eq-repair-orders",
      "repair-orders",
    ]),
    inventory: readArrayFromStorage([
      "t1eq-inventory-items",
      "t1eq-inventory",
      "inventory-items",
    ]),
    inventoryTransactions: readArrayFromStorage([
      "t1eq-inventory-transactions",
      "inventory-transactions",
    ]),
    trucks: readArrayFromStorage([
      "t1eq-trucks",
      "t1eq-truck-stock",
      "trucks",
    ]),
    purchaseOrders: readArrayFromStorage([
      "t1eq-purchase-orders",
      "purchase-orders",
    ]),
    suppliers: readArrayFromStorage(["t1eq-suppliers", "suppliers"]),
    invoices: readArrayFromStorage(["t1eq-invoices", "invoices"]),
  };
}

function calculateDashboardState(): {
  metrics: DashboardMetrics;
  subcategoryValues: SubcategoryValueMap;
} {
  const data = readDashboardData();

  const openRepairOrders = data.repairOrders.filter(
    (repairOrder) => !isClosedRepairOrder(repairOrder)
  );

  const lowInventoryItems = data.inventory.filter((item) => {
    const quantityOnHand = getNumber(
      item,
      ["quantityOnHand", "quantity", "onHand"],
      0
    );

    const minimumQuantity = getNumber(
      item,
      ["minimumQuantity", "minimumStock", "reorderPoint"],
      0
    );

    return minimumQuantity > 0 && quantityOnHand <= minimumQuantity;
  });

  const metrics: DashboardMetrics = {
    customers: data.customers.length,
    equipment: data.equipment.length,
    repairOrders: data.repairOrders.length,
    openRepairOrders: openRepairOrders.length,
    inventory: data.inventory.length,
    lowInventory: lowInventoryItems.length,
    trucks: data.trucks.length,
    purchaseOrders: data.purchaseOrders.length,
    invoices: data.invoices.length,
  };

  const subcategoryValues: SubcategoryValueMap = {
    customers: {
      accounts: data.customers.length,
      contacts: data.customers.filter((customer) =>
        hasAnyText(customer, ["contactName", "phone", "email"])
      ).length,
      locations:
        countNestedArrays(data.customers, ["sites", "locations", "addresses"]) ||
        data.customers.filter((customer) =>
          hasAnyText(customer, ["serviceAddress", "billingAddress", "address"])
        ).length,
      history: data.repairOrders.filter((repairOrder) =>
        hasAnyText(repairOrder, ["customerId", "customerName"])
      ).length,
    },

    equipment: {
      assets: data.equipment.length,
      "model-serial": data.equipment.filter((equipment) =>
        hasAnyText(equipment, [
          "model",
          "serialNumber",
          "manufacturer",
          "assetNumber",
        ])
      ).length,
      locations: data.equipment.filter((equipment) =>
        hasAnyText(equipment, ["siteName", "locationName", "currentLocation"])
      ).length,
      "service-history": data.repairOrders.filter((repairOrder) =>
        hasAnyText(repairOrder, ["equipmentId", "equipmentName"])
      ).length,
    },

    "repair-orders": {
      open: openRepairOrders.length,
      diagnosis: data.repairOrders.filter(
        (repairOrder) =>
          hasAnyText(repairOrder, ["diagnosis", "initialFindings"]) ||
          hasActionType(repairOrder, "diagnosis")
      ).length,
      labor:
        countNestedArrays(data.repairOrders, ["laborEntries"]) +
        countNestedArrays(data.repairOrders, ["actionItems"]),
      parts:
        countNestedArrays(data.repairOrders, ["partEntries"]) +
        data.repairOrders.filter((repairOrder) =>
          hasActionType(repairOrder, "parts")
        ).length,
      photos: countNestedArrays(data.repairOrders, ["photos"]),
    },

    "open-repair-orders": {
      scheduled: openRepairOrders.filter(
        (repairOrder) =>
          statusIncludes(repairOrder, "scheduled") ||
          hasAnyText(repairOrder, ["scheduledDate"])
      ).length,
      "in-progress": openRepairOrders.filter((repairOrder) =>
        statusIncludes(repairOrder, "progress")
      ).length,
      "waiting-parts": openRepairOrders.filter((repairOrder) =>
        statusIncludes(repairOrder, "parts")
      ).length,
      "waiting-approval": openRepairOrders.filter((repairOrder) =>
        statusIncludes(repairOrder, "approval")
      ).length,
    },

    inventory: {
      warehouse: data.inventory.length,
      "part-lookup": data.inventory.filter((item) =>
        hasAnyText(item, ["partNumber", "sku", "description"])
      ).length,
      transactions:
        data.inventoryTransactions.length +
        countNestedArrays(data.inventory, ["transactions"]),
      pricing: data.inventory.filter((item) =>
        Number.isFinite(
          Number(item.cost ?? item.unitCost ?? item.sellPrice ?? item.price)
        )
      ).length,
    },

    "low-inventory": {
      reorder: lowInventoryItems.length,
      minimums: data.inventory.filter(
        (item) =>
          getNumber(item, ["minimumQuantity", "minimumStock", "reorderPoint"], 0) >
          0
      ).length,
      "supplier-review": lowInventoryItems.filter((item) =>
        hasAnyText(item, ["supplierId", "supplierName", "vendorName"])
      ).length,
      "truck-shortage": lowInventoryItems.filter((item) =>
        hasAnyText(item, ["truckId", "truckName", "assignedTruckId"])
      ).length,
    },

    "truck-stock": {
      trucks: data.trucks.length,
      technicians: data.trucks.filter((truck) =>
        hasAnyText(truck, [
          "technicianId",
          "technicianName",
          "assignedTechnicianName",
        ])
      ).length,
      transfers: data.inventoryTransactions.filter((transaction) =>
        getText(transaction, ["type", "transactionType"])
          .toLowerCase()
          .includes("transfer")
      ).length,
      "field-stock": countNestedArrays(data.trucks, [
        "stock",
        "inventory",
        "items",
      ]),
    },

    "purchase-orders": {
      suppliers: data.suppliers.length,
      orders: data.purchaseOrders.length,
      receiving: data.purchaseOrders.filter(
        (purchaseOrder) =>
          statusIncludes(purchaseOrder, "received") ||
          statusIncludes(purchaseOrder, "partial") ||
          hasAnyText(purchaseOrder, ["receivedDate"])
      ).length,
      discrepancies: data.purchaseOrders.filter(
        (purchaseOrder) =>
          statusIncludes(purchaseOrder, "discrep") ||
          hasAnyText(purchaseOrder, ["discrepancyNotes", "shortageNotes"])
      ).length,
    },

    invoices: {
      drafts: countByStatus(data.invoices, ["draft"]),
      issued: data.invoices.filter(
        (invoice) =>
          statusIncludes(invoice, "issued") ||
          statusIncludes(invoice, "sent") ||
          hasAnyText(invoice, ["issuedDate", "sentDate"])
      ).length,
      "repair-order-billing": data.invoices.filter((invoice) =>
        hasAnyText(invoice, ["repairOrderId", "repairOrderNumber"])
      ).length,
      paid: countByStatus(data.invoices, ["paid"]),
    },
  };

  return {
    metrics,
    subcategoryValues,
  };
}

function createDefaultSelectedSubcategories(): SelectedSubcategoryMap {
  return DASHBOARD_TILE_DEFINITIONS.reduce<SelectedSubcategoryMap>(
    (selectedMap, tile) => {
      selectedMap[tile.id] = tile.subcategories
        .slice(0, MAX_VISIBLE_SUBCATEGORIES)
        .map((subcategory) => subcategory.id);

      return selectedMap;
    },
    {}
  );
}

function resolveSelectedIdsForTile(
  tile: DashboardTileDefinition,
  selectedIds: string[] | undefined
): string[] {
  const validIds = new Set(
    tile.subcategories.map((subcategory) => subcategory.id)
  );

  const cleanSelectedIds = (selectedIds ?? [])
    .filter((id) => validIds.has(id))
    .slice(0, MAX_VISIBLE_SUBCATEGORIES);

  if (cleanSelectedIds.length > 0) {
    return cleanSelectedIds;
  }

  return tile.subcategories
    .slice(0, MAX_VISIBLE_SUBCATEGORIES)
    .map((subcategory) => subcategory.id);
}

function resolveSelectedMap(input?: SelectedSubcategoryMap): SelectedSubcategoryMap {
  return DASHBOARD_TILE_DEFINITIONS.reduce<SelectedSubcategoryMap>(
    (selectedMap, tile) => {
      selectedMap[tile.id] = resolveSelectedIdsForTile(tile, input?.[tile.id]);
      return selectedMap;
    },
    {}
  );
}

function readSelectedSubcategories(): SelectedSubcategoryMap {
  if (typeof window === "undefined") {
    return createDefaultSelectedSubcategories();
  }

  try {
    const storedValue = localStorage.getItem(DASHBOARD_SUBCATEGORY_STORAGE_KEY);

    if (!storedValue) {
      return createDefaultSelectedSubcategories();
    }

    return resolveSelectedMap(JSON.parse(storedValue) as SelectedSubcategoryMap);
  } catch {
    return createDefaultSelectedSubcategories();
  }
}

function saveSelectedSubcategories(selectedMap: SelectedSubcategoryMap) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    DASHBOARD_SUBCATEGORY_STORAGE_KEY,
    JSON.stringify(resolveSelectedMap(selectedMap))
  );
}

function InfoBalloon({ description }: { description: string }) {
  return (
    <div
      data-t1eq-balloon="true"
      className="pointer-events-auto absolute bottom-full left-1/2 z-[9999] mb-4 hidden w-80 -translate-x-1/2 rounded-2xl border border-orange-300/40 bg-slate-950 px-4 py-3 text-left text-sm font-semibold leading-6 text-white shadow-2xl shadow-black/80 group-hover:block group-focus-within:block"
    >
      <div
        data-t1eq-balloon-arrow="true"
        className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-orange-300/40 bg-slate-950"
      />
      {description}
    </div>
  );
}

function DashboardTile({
  tile,
  value,
  selectedSubcategories,
}: {
  tile: DashboardTileDefinition;
  value: string | number;
  selectedSubcategories: DisplaySubcategory[];
}) {
  return (
    <Link
      data-t1eq-tile="true"
      href={tile.href}
      aria-label={`${tile.label}. ${tile.description}`}
      className="group relative z-0 overflow-visible rounded-[28px] border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl shadow-black/30 outline-none transition hover:z-50 hover:-translate-y-1 hover:border-orange-300 focus-visible:z-50 focus-visible:border-orange-300"
    >
      <div className={`mb-5 h-1.5 w-20 rounded-full ${tile.accentClass}`} />

      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
          {tile.label}
        </p>
        <p className="mt-3 text-4xl font-black tracking-tight text-white">
          {value}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {selectedSubcategories.map((subcategory) => (
          <div
            key={subcategory.id}
            className="rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-3 text-center"
          >
            <p className="text-2xl font-black leading-none text-white">
              {subcategory.value}
            </p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-300">
              {subcategory.label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Hover for details
      </p>

      <InfoBalloon description={tile.description} />
    </Link>
  );
}

function ActionTile({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      data-t1eq-tile="true"
      href={href}
      aria-label={`${title}. ${description}`}
      className="group relative z-0 overflow-visible rounded-[24px] border border-slate-700 bg-slate-900 p-5 text-white shadow-xl shadow-black/20 outline-none transition hover:z-50 hover:-translate-y-1 hover:border-orange-300 focus-visible:z-50 focus-visible:border-orange-300"
    >
      <h3 className="text-base font-black text-white">{title}</h3>

      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Hover for details
      </p>

      <InfoBalloon description={description} />
    </Link>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [subcategoryValues, setSubcategoryValues] =
    useState<SubcategoryValueMap>({});
  const [savedSubcategories, setSavedSubcategories] =
    useState<SelectedSubcategoryMap>(() => createDefaultSelectedSubcategories());
  const [draftSubcategories, setDraftSubcategories] =
    useState<SelectedSubcategoryMap>(() => createDefaultSelectedSubcategories());
  const [subcategoryMessage, setSubcategoryMessage] = useState("");
  const [isSubcategoryChooserOpen, setIsSubcategoryChooserOpen] =
    useState(false);

  useEffect(() => {
    const storedSubcategories = readSelectedSubcategories();
    const dashboardState = calculateDashboardState();

    setMetrics(dashboardState.metrics);
    setSubcategoryValues(dashboardState.subcategoryValues);
    setSavedSubcategories(storedSubcategories);
    setDraftSubcategories(storedSubcategories);

    function refreshDashboard() {
      const refreshedDashboardState = calculateDashboardState();

      setMetrics(refreshedDashboardState.metrics);
      setSubcategoryValues(refreshedDashboardState.subcategoryValues);
    }

    window.addEventListener("storage", refreshDashboard);
    window.addEventListener("t1eq-customers-changed", refreshDashboard);
    window.addEventListener("t1eq-equipment-changed", refreshDashboard);
    window.addEventListener("t1eq-repair-orders-changed", refreshDashboard);
    window.addEventListener("t1eq-inventory-changed", refreshDashboard);
    window.addEventListener("t1eq-trucks-changed", refreshDashboard);
    window.addEventListener("t1eq-purchase-orders-changed", refreshDashboard);
    window.addEventListener("t1eq-invoices-changed", refreshDashboard);
    window.addEventListener("t1eq-appearance-settings-changed", refreshDashboard);

    return () => {
      window.removeEventListener("storage", refreshDashboard);
      window.removeEventListener("t1eq-customers-changed", refreshDashboard);
      window.removeEventListener("t1eq-equipment-changed", refreshDashboard);
      window.removeEventListener("t1eq-repair-orders-changed", refreshDashboard);
      window.removeEventListener("t1eq-inventory-changed", refreshDashboard);
      window.removeEventListener("t1eq-trucks-changed", refreshDashboard);
      window.removeEventListener("t1eq-purchase-orders-changed", refreshDashboard);
      window.removeEventListener("t1eq-invoices-changed", refreshDashboard);
      window.removeEventListener(
        "t1eq-appearance-settings-changed",
        refreshDashboard
      );
    };
  }, []);

  function toggleSubcategory(tileId: string, subcategoryId: string) {
    setDraftSubcategories((currentMap) => {
      const currentSelection = currentMap[tileId] ?? [];
      const isSelected = currentSelection.includes(subcategoryId);

      const nextSelection = isSelected
        ? currentSelection.filter((id) => id !== subcategoryId)
        : currentSelection.length >= MAX_VISIBLE_SUBCATEGORIES
          ? currentSelection
          : [...currentSelection, subcategoryId];

      setSubcategoryMessage("");

      return {
        ...currentMap,
        [tileId]: nextSelection,
      };
    });
  }

  function saveSubcategoryChoices() {
    const resolvedDraft = resolveSelectedMap(draftSubcategories);

    setSavedSubcategories(resolvedDraft);
    setDraftSubcategories(resolvedDraft);
    saveSelectedSubcategories(resolvedDraft);
    setSubcategoryMessage("Subcategory choices saved.");
    setIsSubcategoryChooserOpen(false);
  }

  function resetSubcategories() {
    const defaultSelection = createDefaultSelectedSubcategories();

    setDraftSubcategories(defaultSelection);
    setSavedSubcategories(defaultSelection);
    saveSelectedSubcategories(defaultSelection);
    setSubcategoryMessage("Subcategory choices reset to defaults.");
    setIsSubcategoryChooserOpen(false);
  }

  function openSubcategoryChooser() {
    setDraftSubcategories(savedSubcategories);
    setSubcategoryMessage("");
    setIsSubcategoryChooserOpen(true);
  }

  const dashboardTiles = useMemo(
    () =>
      DASHBOARD_TILE_DEFINITIONS.map((tile) => {
        const selectedIds = resolveSelectedIdsForTile(
          tile,
          savedSubcategories[tile.id]
        );

        const selectedTileSubcategories = selectedIds
          .map((selectedId) => {
            const subcategory = tile.subcategories.find(
              (candidate) => candidate.id === selectedId
            );

            if (!subcategory) {
              return null;
            }

            return {
              ...subcategory,
              value: subcategoryValues[tile.id]?.[subcategory.id] ?? 0,
            };
          })
          .filter(
            (subcategory): subcategory is DisplaySubcategory =>
              Boolean(subcategory)
          );

        return {
          tile,
          value: metrics[tile.metricKey],
          selectedSubcategories: selectedTileSubcategories,
        };
      }),
    [metrics, savedSubcategories, subcategoryValues]
  );

  return (
    <main
      className="min-h-screen px-6 py-8 text-white"
      style={{
        background: "#020617",
        color: "#ffffff",
        opacity: 1,
        filter: "none",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-8 overflow-visible">
        <section
          data-t1eq-tile="true"
          data-t1eq-tile-id="operations-dashboard-card"
          aria-label="Operations Dashboard. Main dashboard overview card."
          className="group relative z-0 min-h-[250px] overflow-visible rounded-[32px] border border-slate-700 bg-slate-900 p-8 text-white shadow-2xl shadow-black/40 outline-none transition hover:z-50 hover:border-orange-300 focus-visible:z-50 focus-visible:border-orange-300"
        >
          

          <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[58%] rounded-l-[32px] bg-gradient-to-r from-black/45 via-black/25 to-transparent" />

          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-300">
              Tier One Equipment
            </p>

            <div className="mt-3">
              <h1 className="text-4xl font-black tracking-tight text-white">
                Operations Dashboard
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Manage customers, sites, equipment, repair orders, inventory,
                truck stock, purchase orders, invoices, and field operations.
              </p>
            </div>
          </div>


        </section>

        {isSubcategoryChooserOpen && (
          <section className="rounded-[28px] border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                  Tile Subcategories
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Choose Up To 3 Per Tile
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  Choose the subcategories, then press Save Subcategory Choices
                  to lock them onto the dashboard tiles.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveSubcategoryChoices}
                  className="rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-xl shadow-black/30 transition hover:bg-orange-400"
                >
                  Save Subcategory Choices
                </button>

                <button
                  type="button"
                  onClick={() => setIsSubcategoryChooserOpen(false)}
                  className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={resetSubcategories}
                  className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {DASHBOARD_TILE_DEFINITIONS.map((tile) => {
                const selectedIds = draftSubcategories[tile.id] ?? [];

                return (
                  <div
                    key={tile.id}
                    className="rounded-2xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-white">
                        {tile.label}
                      </h3>
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                        {selectedIds.length}/{MAX_VISIBLE_SUBCATEGORIES}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tile.subcategories.map((subcategory) => {
                        const isSelected = selectedIds.includes(
                          subcategory.id
                        );
                        const isDisabled =
                          !isSelected &&
                          selectedIds.length >= MAX_VISIBLE_SUBCATEGORIES;

                        return (
                          <button
                            key={subcategory.id}
                            type="button"
                            disabled={isDisabled}
                            onClick={() =>
                              toggleSubcategory(tile.id, subcategory.id)
                            }
                            title={subcategory.description}
                            className={`rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
                              isSelected
                                ? "border-orange-300 bg-orange-500 text-white"
                                : isDisabled
                                  ? "cursor-not-allowed border-slate-800 bg-slate-950 text-slate-600"
                                  : "border-slate-600 bg-slate-800 text-slate-200 hover:border-orange-300 hover:text-white"
                            }`}
                          >
                            {subcategory.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="overflow-visible">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Command Tiles
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">
                System Overview
              </h2>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              {subcategoryMessage && !isSubcategoryChooserOpen && (
                <p className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-200">
                  {subcategoryMessage}
                </p>
              )}

              <button
                data-t1eq-page-button="true"
                type="button"
                onClick={openSubcategoryChooser}
                className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
              >
                Edit Tile Subcategories
              </button>

              <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Hover any tile for details
              </p>
            </div>
          </div>

          <div className="grid overflow-visible gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardTiles.map(({ tile, value, selectedSubcategories }) => (
              <DashboardTile
                key={tile.id}
                tile={tile}
                value={value}
                selectedSubcategories={selectedSubcategories}
              />
            ))}
          </div>
        </section>

        <section className="overflow-visible">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Quick Actions
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Start Common Workflows
            </h2>
          </div>

          <div className="grid overflow-visible gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ActionTile
              title="Create Repair Order"
              description="Start a new repair order with customer concern, equipment assignment, technician routing, labor, parts, photos, and billing workflow."
              href="/repair-orders"
            />

            <ActionTile
              title="Add Customer"
              description="Create or update customer account information, contacts, billing data, and service-location records."
              href="/customers"
            />

            <ActionTile
              title="Add Equipment"
              description="Create a customer equipment record with model, serial, asset data, location, and future inspection or repair history."
              href="/equipment"
            />

            <ActionTile
              title="Add Inventory Item"
              description="Create warehouse inventory with part numbers, pictures, cross references, cost, sell price, quantity, and minimum stock levels."
              href="/inventory"
            />

            <ActionTile
              title="Inventory Transactions"
              description="Review warehouse receipts, repair-order consumption, returns, adjustments, references, and full inventory audit history."
              href="/inventory/transactions"
            />

            <ActionTile
              title="Purchase Orders"
              description="Begin procurement workflow for supplier orders, receiving, incoming quantity tracking, discrepancy review, and inventory replenishment."
              href="/purchase-orders"
            />

            <ActionTile
              title="Truck Stock"
              description="Create service trucks, assign technicians, load inventory from warehouse stock to field vehicles, and review field stock movement."
              href="/truck-stock"
            />

            <ActionTile
              title="Dispatch"
              description="Review scheduling, dispatch workload, assigned technicians, open repair orders, and field service routing."
              href="/dispatch"
            />

            <ActionTile
              title="Invoices"
              description="Generate or review customer invoices from repair-order billing summaries, labor, parts, and other charges."
              href="/invoices"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
