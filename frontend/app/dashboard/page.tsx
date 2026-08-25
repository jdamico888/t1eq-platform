"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import type { OperationalDashboardChartDefinition } from "@/types/operational-dashboard-chart";
import {
  getOperationalDashboardCharts,
  getVisibleOperationalDashboardCharts,
  updateOperationalDashboardChart,
} from "@/services/operational-dashboard-charts";
import { resolveOperationalDashboardChartData } from "@/services/operational-dashboard-metrics";
import OperationalDashboardChartRenderer from "@/components/dashboard/OperationalDashboardChartRenderer";
import { type ArrangeableMenuItem } from "@/components/dashboard/ArrangeableTileGrid";
import FreeformTileCanvas, {
  type TileCanvasHandle,
} from "@/components/dashboard/FreeformTileCanvas";
import {
  DASHBOARD_LAYOUT_CHANGED_EVENT,
  arrangeDashboardTiles,
  createEmptySectionLayout,
  getDashboardSectionLayout,
  hideDashboardTile,
  resetDashboardSectionLayout,
  showDashboardTile,
  type DashboardSectionLayout,
} from "@/services/dashboard-layout";

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

const DASHBOARD_SCOPE = "dashboard";

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

type QuickActionDefinition = {
  id: string;
  title: string;
  description: string;
  href: string;
};

/*
 * These were written straight into the markup. They are data now so the
 * same drag, trash, and picker behaviour that the command tiles have can
 * reach them too.
 */
const QUICK_ACTION_DEFINITIONS: QuickActionDefinition[] = [
  {
    id: "create-repair-order",
    title: "Create Repair Order",
    description:
      "Start a new repair order with customer concern, equipment assignment, technician routing, labor, parts, photos, and billing workflow.",
    href: "/repair-orders",
  },
  {
    id: "add-customer",
    title: "Add Customer",
    description:
      "Create or update customer account information, contacts, billing data, and optional service-location records.",
    href: "/customers",
  },
  {
    id: "add-equipment",
    title: "Add Equipment",
    description:
      "Create a customer equipment record with model, serial, asset data, location, and future inspection or repair history.",
    href: "/equipment",
  },
  {
    id: "add-inventory-item",
    title: "Add Inventory Item",
    description:
      "Create warehouse inventory with part numbers, pictures, cross references, cost, sell price, quantity, and minimum stock levels.",
    href: "/inventory",
  },
  {
    id: "inventory-transactions",
    title: "Inventory Transactions",
    description:
      "Review warehouse receipts, repair-order consumption, returns, adjustments, references, and full inventory audit history.",
    href: "/inventory/transactions",
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    description:
      "Begin procurement workflow for supplier orders, receiving, incoming quantity tracking, discrepancy review, and inventory replenishment.",
    href: "/purchase-orders",
  },
  {
    id: "truck-stock",
    title: "Truck Stock",
    description:
      "Create service trucks, assign technicians, load inventory from warehouse stock to field vehicles, and review field stock movement.",
    href: "/truck-stock",
  },
  {
    id: "dispatch",
    title: "Dispatch",
    description:
      "Review scheduling, dispatch workload, assigned technicians, open repair orders, and field service routing.",
    href: "/dispatch",
  },
  {
    id: "invoices",
    title: "Invoices",
    description:
      "Generate or review customer invoices from repair-order billing summaries, inspection charges, repair charges, parts, and other charges.",
    href: "/invoices",
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
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item)
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

function getNumber(
  record: StoredRecord,
  keys: string[],
  fallback = 0
): number {
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

        return Array.isArray(value)
          ? nestedTotal + value.length
          : nestedTotal;
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
          getNumber(
            item,
            ["minimumQuantity", "minimumStock", "reorderPoint"],
            0
          ) > 0
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

function resolveSelectedMap(
  input?: SelectedSubcategoryMap
): SelectedSubcategoryMap {
  return DASHBOARD_TILE_DEFINITIONS.reduce<SelectedSubcategoryMap>(
    (selectedMap, tile) => {
      selectedMap[tile.id] = resolveSelectedIdsForTile(
        tile,
        input?.[tile.id]
      );

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
    const storedValue = localStorage.getItem(
      DASHBOARD_SUBCATEGORY_STORAGE_KEY
    );

    if (!storedValue) {
      return createDefaultSelectedSubcategories();
    }

    return resolveSelectedMap(
      JSON.parse(storedValue) as SelectedSubcategoryMap
    );
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

function InfoBalloon({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  return (
    <div
      data-t1eq-balloon-region="true"
      className="pointer-events-none absolute bottom-full left-1/2 z-[9999] hidden w-80 -translate-x-1/2 pb-4 group-hover:block group-focus-within:block"
    >
      <div
        data-t1eq-balloon="true"
        data-t1eq-qbit-type="information-balloon"
        data-t1eq-qbit-id={id}
        data-t1eq-qbit-scope={DASHBOARD_SCOPE}
        className="relative rounded-2xl border border-orange-300/40 bg-slate-950 px-4 py-3 text-left text-sm font-semibold leading-6 text-white shadow-2xl shadow-black/80"
      >
        <div
          data-t1eq-balloon-arrow="true"
          className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-orange-300/40 bg-slate-950"
        />

        {description}
      </div>
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
      data-t1eq-qbit-type="tile"
      data-t1eq-qbit-id={`dashboard-tile-${tile.id}`}
      data-t1eq-qbit-scope={DASHBOARD_SCOPE}
      href={tile.href}
      aria-label={`${tile.label}. ${tile.description}`}
      /*
       * block h-full: the tile is an anchor, and it used to be a grid item
       * itself. Now that the arrangeable grid wraps each tile in a
       * draggable div, nothing blockifies the anchor any more — without
       * this it would collapse back to inline and lose its padding and
       * equal-height row.
       */
      className="group relative z-0 block h-full overflow-visible rounded-[28px] border border-slate-700 bg-slate-900 p-5 text-white shadow-2xl shadow-black/30 outline-none transition hover:z-50 hover:-translate-y-1 hover:border-orange-300 focus-visible:z-50 focus-visible:border-orange-300"
    >
      <div
        data-t1eq-qbit-type="section"
        data-t1eq-qbit-id={`dashboard-tile-${tile.id}-accent`}
        data-t1eq-qbit-scope={DASHBOARD_SCOPE}
        className={`mb-5 h-1.5 w-20 rounded-full ${tile.accentClass}`}
      />

      <div
        data-t1eq-qbit-type="section"
        data-t1eq-qbit-id={`dashboard-tile-${tile.id}-metric`}
        data-t1eq-qbit-scope={DASHBOARD_SCOPE}
      >
        <p
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id={`dashboard-tile-${tile.id}-label`}
          data-t1eq-qbit-scope={DASHBOARD_SCOPE}
          className="text-xs font-black uppercase tracking-[0.22em] text-slate-400"
        >
          {tile.label}
        </p>

        <p
          data-t1eq-qbit-type="text"
          data-t1eq-qbit-id={`dashboard-tile-${tile.id}-value`}
          data-t1eq-qbit-scope={DASHBOARD_SCOPE}
          className="mt-3 text-4xl font-black tracking-tight text-white"
        >
          {value}
        </p>
      </div>

      <div
        data-t1eq-qbit-type="section"
        data-t1eq-qbit-id={`dashboard-tile-${tile.id}-subcategories`}
        data-t1eq-qbit-scope={DASHBOARD_SCOPE}
        className="mt-5 grid grid-cols-3 gap-3"
      >
        {selectedSubcategories.map((subcategory) => (
          <div
            key={subcategory.id}
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id={`dashboard-tile-${tile.id}-subcategory-${subcategory.id}`}
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-3 text-center"
          >
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id={`dashboard-tile-${tile.id}-subcategory-${subcategory.id}-value`}
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="text-2xl font-black leading-none text-white"
            >
              {subcategory.value}
            </p>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id={`dashboard-tile-${tile.id}-subcategory-${subcategory.id}-label`}
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="mt-2 text-[10px] font-black uppercase tracking-wide text-slate-300"
            >
              {subcategory.label}
            </p>
          </div>
        ))}
      </div>

      <InfoBalloon
        id={`dashboard-tile-${tile.id}-information-balloon`}
        description={tile.description}
      />
    </Link>
  );
}

function ActionTile({
  id,
  title,
  description,
  href,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      data-t1eq-tile="true"
      data-t1eq-qbit-type="tile"
      data-t1eq-qbit-id={`dashboard-quick-action-${id}`}
      data-t1eq-qbit-scope={DASHBOARD_SCOPE}
      href={href}
      aria-label={`${title}. ${description}`}
      /* block h-full for the same reason as the command tile above. */
      className="group relative z-0 block h-full overflow-visible rounded-[24px] border border-slate-700 bg-slate-900 p-5 text-white shadow-xl shadow-black/20 outline-none transition hover:z-50 hover:-translate-y-1 hover:border-orange-300 focus-visible:z-50 focus-visible:border-orange-300"
    >
      <h3
        data-t1eq-qbit-type="text"
        data-t1eq-qbit-id={`dashboard-quick-action-${id}-title`}
        data-t1eq-qbit-scope={DASHBOARD_SCOPE}
        className="text-base font-black text-white"
      >
        {title}
      </h3>

      <InfoBalloon
        id={`dashboard-quick-action-${id}-information-balloon`}
        description={description}
      />
    </Link>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);

  const [subcategoryValues, setSubcategoryValues] =
    useState<SubcategoryValueMap>({});

  const [savedSubcategories, setSavedSubcategories] =
    useState<SelectedSubcategoryMap>(() =>
      createDefaultSelectedSubcategories()
    );

  const [draftSubcategories, setDraftSubcategories] =
    useState<SelectedSubcategoryMap>(() =>
      createDefaultSelectedSubcategories()
    );

  const [subcategoryMessage, setSubcategoryMessage] = useState("");

  const [isSubcategoryChooserOpen, setIsSubcategoryChooserOpen] =
    useState(false);

  /*
   * Report tiles configured in Settings. Resolved on the client only —
   * every metric reads from localStorage, which is empty during server
   * rendering.
   */
  const [chartDefinitions, setChartDefinitions] = useState<
    OperationalDashboardChartDefinition[]
  >([]);

  /*
   * Reports configured but not currently on the dashboard — the pool the
   * right-click picker offers. Held in state rather than read during
   * render, since reading localStorage at render time would differ between
   * server and client and trip a hydration mismatch.
   */
  const [hiddenChartOptions, setHiddenChartOptions] = useState<
    { id: string; title: string; metric: string; timeRange: string }[]
  >([]);

  /*
   * How the person has arranged each section. Empty until the effect below
   * reads it, so the first client render matches what the server rendered
   * and hydration stays quiet.
   */
  const [commandTileLayout, setCommandTileLayout] =
    useState<DashboardSectionLayout>(createEmptySectionLayout);

  const [quickActionLayout, setQuickActionLayout] =
    useState<DashboardSectionLayout>(createEmptySectionLayout);

  const router = useRouter();

  /*
   * Right-click opens the tile picker, but nothing on screen says so. These
   * let each section's header offer a plain button that opens the same
   * menu — the feature is unusable if nobody can find it.
   */
  const commandCanvasRef = useRef<TileCanvasHandle | null>(null);
  const quickActionCanvasRef = useRef<TileCanvasHandle | null>(null);
  const reportCanvasRef = useRef<TileCanvasHandle | null>(null);

  /** Opens a picker directly beneath the button that asked for it. */
  function openPickerUnder(
    canvas: React.RefObject<TileCanvasHandle | null>,
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    const rect = event.currentTarget.getBoundingClientRect();

    canvas.current?.openPicker({ x: rect.left, y: rect.bottom + 8 });
  }

  function loadSectionLayouts() {
    setCommandTileLayout(getDashboardSectionLayout("commandTiles"));
    setQuickActionLayout(getDashboardSectionLayout("quickActions"));
  }

  function loadChartDefinitions() {
    setChartDefinitions(
      getVisibleOperationalDashboardCharts().map((chart) => ({
        chart,
        data: resolveOperationalDashboardChartData(chart),
      }))
    );

    setHiddenChartOptions(
      getOperationalDashboardCharts()
        .filter((chart) => !chart.showOnOperationsDashboard)
        .map((chart) => ({
          id: chart.id,
          title: chart.title,
          metric: chart.metric,
          timeRange: chart.timeRange,
        }))
    );
  }

  /**
   * Dropping on the trash takes the tile off the dashboard rather than
   * deleting the report — it stays configured and can be added back from
   * the right-click picker.
   */
  function handleRemoveReportTile(chartId: string) {
    updateOperationalDashboardChart(chartId, {
      showOnOperationsDashboard: false,
    });

    loadChartDefinitions();
  }

  function handleAddReportTile(chartId: string) {
    updateOperationalDashboardChart(chartId, {
      showOnOperationsDashboard: true,
    });

    loadChartDefinitions();
  }

  const reportPickerItems: ArrangeableMenuItem[] = [
    ...hiddenChartOptions.map((chart) => ({
      label: `Add: ${chart.title}`,
      description: `${chart.metric} · ${chart.timeRange}`,
      onSelect: () => handleAddReportTile(chart.id),
    })),
    {
      label: "Create Report Widget…",
      description: "Build a new live chart from your operations data.",
      onSelect: () =>
        router.push("/settings/operational-dashboard-charts"),
    },
  ];

  useEffect(() => {
    const storedSubcategories = readSelectedSubcategories();
    const dashboardState = calculateDashboardState();

    setMetrics(dashboardState.metrics);
    setSubcategoryValues(dashboardState.subcategoryValues);

    setSavedSubcategories(storedSubcategories);
    setDraftSubcategories(storedSubcategories);

    loadChartDefinitions();
    loadSectionLayouts();

    function refreshDashboard() {
      const refreshedDashboardState = calculateDashboardState();

      setMetrics(refreshedDashboardState.metrics);
      setSubcategoryValues(refreshedDashboardState.subcategoryValues);

      loadChartDefinitions();
    }

    /*
     * Report widgets are meant to read live. The events below cover data
     * changing; this tick covers time moving — a "Last 7 Days" chart has a
     * window that slides even when nothing is edited.
     */
    const liveRefreshTimer = window.setInterval(
      loadChartDefinitions,
      60_000
    );

    window.addEventListener("storage", refreshDashboard);
    window.addEventListener(
      DASHBOARD_LAYOUT_CHANGED_EVENT,
      loadSectionLayouts
    );
    window.addEventListener("t1eq-customers-changed", refreshDashboard);
    window.addEventListener("t1eq-equipment-changed", refreshDashboard);
    window.addEventListener("t1eq-repair-orders-changed", refreshDashboard);
    window.addEventListener("t1eq-inventory-changed", refreshDashboard);
    window.addEventListener("t1eq-trucks-changed", refreshDashboard);
    window.addEventListener("t1eq-purchase-orders-changed", refreshDashboard);
    window.addEventListener("t1eq-invoices-changed", refreshDashboard);
    window.addEventListener(
      "t1eq-appearance-settings-changed",
      refreshDashboard
    );

    return () => {
      window.clearInterval(liveRefreshTimer);

      window.removeEventListener("storage", refreshDashboard);
      window.removeEventListener(
        DASHBOARD_LAYOUT_CHANGED_EVENT,
        loadSectionLayouts
      );
      window.removeEventListener("t1eq-customers-changed", refreshDashboard);
      window.removeEventListener("t1eq-equipment-changed", refreshDashboard);
      window.removeEventListener(
        "t1eq-repair-orders-changed",
        refreshDashboard
      );
      window.removeEventListener("t1eq-inventory-changed", refreshDashboard);
      window.removeEventListener("t1eq-trucks-changed", refreshDashboard);
      window.removeEventListener(
        "t1eq-purchase-orders-changed",
        refreshDashboard
      );
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

  const arrangedCommandTiles = useMemo(
    () =>
      arrangeDashboardTiles(
        dashboardTiles,
        (entry) => entry.tile.id,
        commandTileLayout
      ),
    [dashboardTiles, commandTileLayout]
  );

  const arrangedQuickActions = useMemo(
    () =>
      arrangeDashboardTiles(
        QUICK_ACTION_DEFINITIONS,
        (quickAction) => quickAction.id,
        quickActionLayout
      ),
    [quickActionLayout]
  );

  /*
   * The trash takes a tile off the dashboard; it does not delete anything.
   * Every removed tile is listed in the right-click picker, so a tile is
   * always one press away from coming back.
   */
  function handleRemoveCommandTile(tileId: string) {
    setCommandTileLayout(hideDashboardTile("commandTiles", tileId));
  }

  function handleRemoveQuickAction(tileId: string) {
    setQuickActionLayout(hideDashboardTile("quickActions", tileId));
  }

  const hasCommandTileLayout =
    commandTileLayout.order.length > 0 ||
    commandTileLayout.hidden.length > 0;

  const commandTilePickerItems: ArrangeableMenuItem[] = [
    ...arrangedCommandTiles.hidden.map(({ tile }) => ({
      label: `Add: ${tile.label}`,
      description: "Put this tile back on the dashboard.",
      onSelect: () =>
        setCommandTileLayout(showDashboardTile("commandTiles", tile.id)),
    })),

    ...(hasCommandTileLayout
      ? [
          {
            label: "Reset Command Tiles",
            description:
              "Return every command tile to its original place.",
            onSelect: () =>
              setCommandTileLayout(
                resetDashboardSectionLayout("commandTiles")
              ),
          },
        ]
      : []),
  ];

  const hasQuickActionLayout =
    quickActionLayout.order.length > 0 ||
    quickActionLayout.hidden.length > 0;

  const quickActionPickerItems: ArrangeableMenuItem[] = [
    ...arrangedQuickActions.hidden.map((quickAction) => ({
      label: `Add: ${quickAction.title}`,
      description: "Put this shortcut back on the dashboard.",
      onSelect: () =>
        setQuickActionLayout(
          showDashboardTile("quickActions", quickAction.id)
        ),
    })),

    ...(hasQuickActionLayout
      ? [
          {
            label: "Reset Quick Actions",
            description:
              "Return every shortcut to its original place.",
            onSelect: () =>
              setQuickActionLayout(
                resetDashboardSectionLayout("quickActions")
              ),
          },
        ]
      : []),
  ];

  return (
    <main
      data-t1eq-page-background="true"
      data-t1eq-qbit-type="background"
      data-t1eq-qbit-id="dashboard-background"
      data-t1eq-qbit-scope={DASHBOARD_SCOPE}
      className="min-h-screen px-6 py-8 text-white"
      style={{
        opacity: 1,
        filter: "none",
      }}
    >
      <div
        data-t1eq-qbit-type="section"
        data-t1eq-qbit-id="dashboard-content-container"
        data-t1eq-qbit-scope={DASHBOARD_SCOPE}
        className="mx-auto max-w-7xl space-y-8 overflow-visible"
      >
        <section
          data-t1eq-tile="true"
          data-t1eq-tile-id="operations-dashboard-card"
          data-t1eq-qbit-type="tile"
          data-t1eq-qbit-id="dashboard-operations-hero"
          data-t1eq-qbit-scope={DASHBOARD_SCOPE}
          aria-label="Operations Dashboard. Main dashboard overview card."
          className="group relative z-0 min-h-[250px] overflow-visible rounded-[32px] border border-slate-700 bg-slate-900 p-8 text-white shadow-2xl shadow-black/40 outline-none transition hover:z-50 hover:border-orange-300 focus-visible:z-50 focus-visible:border-orange-300"
        >
          <div
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="dashboard-operations-hero-overlay"
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[58%] rounded-l-[32px] bg-gradient-to-r from-black/45 via-black/25 to-transparent"
          />

          <div
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="dashboard-operations-hero-content"
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="relative z-10 max-w-3xl"
          >
            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="dashboard-company-label"
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="text-xs font-black uppercase tracking-[0.28em] text-orange-300"
            >
              Tier One Equipment
            </p>

            <h1
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="dashboard-title"
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="mt-3 text-4xl font-black tracking-tight text-white"
            >
              Operations Dashboard
            </h1>

            <p
              data-t1eq-qbit-type="text"
              data-t1eq-qbit-id="dashboard-description"
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="mt-3 text-sm font-semibold leading-6 text-slate-300"
            >
              Manage customers, optional multi-site locations, equipment,
              repair orders, inventory, truck stock, purchase orders, invoices,
              and field operations.
            </p>
          </div>
        </section>

        {isSubcategoryChooserOpen && (
          <section
            data-t1eq-page-card="true"
            data-t1eq-qbit-type="page-card"
            data-t1eq-qbit-id="dashboard-subcategory-chooser"
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="rounded-[28px] border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30"
          >
            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="dashboard-subcategory-chooser-header"
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                  Tile Subcategories
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Choose Up To 3 Per Tile
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-300">
                  Choose the subcategories, then save them to the dashboard.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  data-t1eq-action-button="true"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="dashboard-subcategory-save-button"
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  type="button"
                  onClick={saveSubcategoryChoices}
                  className="rounded-2xl bg-orange-500 px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-xl shadow-black/30 transition hover:bg-orange-400"
                >
                  Save Subcategory Choices
                </button>

                <button
                  data-t1eq-action-button="true"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="dashboard-subcategory-cancel-button"
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  type="button"
                  onClick={() => setIsSubcategoryChooserOpen(false)}
                  className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
                >
                  Cancel
                </button>

                <button
                  data-t1eq-action-button="true"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="dashboard-subcategory-reset-button"
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  type="button"
                  onClick={resetSubcategories}
                  className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <div
              data-t1eq-qbit-type="section"
              data-t1eq-qbit-id="dashboard-subcategory-chooser-grid"
              data-t1eq-qbit-scope={DASHBOARD_SCOPE}
              className="grid gap-4 lg:grid-cols-3"
            >
              {DASHBOARD_TILE_DEFINITIONS.map((tile) => {
                const selectedIds = draftSubcategories[tile.id] ?? [];

                return (
                  <div
                    key={tile.id}
                    data-t1eq-page-card="true"
                    data-t1eq-qbit-type="page-card"
                    data-t1eq-qbit-id={`dashboard-subcategory-chooser-${tile.id}`}
                    data-t1eq-qbit-scope={DASHBOARD_SCOPE}
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
                        const isSelected = selectedIds.includes(subcategory.id);

                        const isDisabled =
                          !isSelected &&
                          selectedIds.length >= MAX_VISIBLE_SUBCATEGORIES;

                        return (
                          <button
                            key={subcategory.id}
                            data-t1eq-action-button="true"
                            data-t1eq-qbit-type="action-button"
                            data-t1eq-qbit-id={`dashboard-subcategory-choice-${tile.id}-${subcategory.id}`}
                            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
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

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="dashboard-command-tiles-section"
          data-t1eq-qbit-scope={DASHBOARD_SCOPE}
          className="overflow-visible"
        >
          <div
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="dashboard-command-tiles-header"
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
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
                <p
                  data-t1eq-qbit-type="information-balloon"
                  data-t1eq-qbit-id="dashboard-subcategory-status-message"
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-200"
                >
                  {subcategoryMessage}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  data-t1eq-action-button="true"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="dashboard-add-command-tile-button"
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  type="button"
                  onClick={(event) =>
                    openPickerUnder(commandCanvasRef, event)
                  }
                  className="rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
                >
                  + Add Tile
                </button>

                <button
                  data-t1eq-action-button="true"
                  data-t1eq-accent-button="true"
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id="dashboard-edit-subcategories-button"
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  type="button"
                  onClick={openSubcategoryChooser}
                  className="rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-wide transition"
                >
                  Edit Tile Subcategories
                </button>
              </div>

              <p className="hidden text-xs font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Hover for details · drag to arrange · right-click to add
              </p>
            </div>
          </div>

          <FreeformTileCanvas
            ref={commandCanvasRef}
            sectionKey="commandTiles"
            qbitId="dashboard-command-tiles-grid"
            qbitScope={DASHBOARD_SCOPE}
            tiles={arrangedCommandTiles.visible.map(
              ({ tile, value, selectedSubcategories }) => ({
                id: tile.id,
                defaultColumnSpan: 4,
                defaultRowSpan: 11,
                content: (
                  <DashboardTile
                    tile={tile}
                    value={value}
                    selectedSubcategories={selectedSubcategories}
                  />
                ),
              })
            )}
            onRemove={handleRemoveCommandTile}
            menuItems={commandTilePickerItems}
            emptyState={
              <div
                data-t1eq-page-card="true"
                data-t1eq-qbit-type="page-card"
                data-t1eq-qbit-id="dashboard-command-tiles-empty"
                data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                className="rounded-[28px] border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center"
              >
                <p className="text-sm font-black text-white">
                  No command tiles on the dashboard.
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Right-click here to put them back. Nothing was deleted.
                </p>
              </div>
            }
          />
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="dashboard-quick-actions-section"
          data-t1eq-qbit-scope={DASHBOARD_SCOPE}
          className="overflow-visible"
        >
          <div
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="dashboard-quick-actions-header"
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="mb-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Quick Actions
            </p>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 className="mt-1 text-2xl font-black text-white">
                Start Common Workflows
              </h2>

              <button
                data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="dashboard-add-quick-action-button"
                data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                type="button"
                onClick={(event) =>
                  openPickerUnder(quickActionCanvasRef, event)
                }
                className="shrink-0 rounded-2xl border border-slate-600 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-white transition hover:border-orange-300"
              >
                + Add Shortcut
              </button>
            </div>
          </div>

          <FreeformTileCanvas
            ref={quickActionCanvasRef}
            sectionKey="quickActions"
            qbitId="dashboard-quick-actions-grid"
            qbitScope={DASHBOARD_SCOPE}
            tiles={arrangedQuickActions.visible.map((quickAction) => ({
              id: quickAction.id,
              defaultColumnSpan: 4,
              defaultRowSpan: 4,
              content: (
                <ActionTile
                  id={quickAction.id}
                  title={quickAction.title}
                  description={quickAction.description}
                  href={quickAction.href}
                />
              ),
            }))}
            onRemove={handleRemoveQuickAction}
            menuItems={quickActionPickerItems}
            emptyState={
              <div
                data-t1eq-page-card="true"
                data-t1eq-qbit-type="page-card"
                data-t1eq-qbit-id="dashboard-quick-actions-empty"
                data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                className="rounded-[24px] border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center"
              >
                <p className="text-sm font-black text-white">
                  No shortcuts on the dashboard.
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Right-click here to put them back. Nothing was deleted.
                </p>
              </div>
            }
          />
        </section>

        <section
          data-t1eq-qbit-type="section"
          data-t1eq-qbit-id="dashboard-reports-section"
          data-t1eq-qbit-scope={DASHBOARD_SCOPE}
          className="overflow-visible"
        >
          <div
            data-t1eq-qbit-type="section"
            data-t1eq-qbit-id="dashboard-reports-header"
            data-t1eq-qbit-scope={DASHBOARD_SCOPE}
            className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                Information Tiles
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Reports &amp; Charts
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="dashboard-add-report-tile-button"
                data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                type="button"
                onClick={(event) => openPickerUnder(reportCanvasRef, event)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
              >
                + Add Tile
              </button>

              <Link
                data-t1eq-action-button="true"
                data-t1eq-qbit-type="action-button"
                data-t1eq-qbit-id="dashboard-reports-configure"
                data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                href="/settings/operational-dashboard-charts"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
              >
                Configure Reports
              </Link>
            </div>
          </div>

          <FreeformTileCanvas
            ref={reportCanvasRef}
            sectionKey="reportTiles"
            qbitId="dashboard-reports-grid"
            qbitScope={DASHBOARD_SCOPE}
            tiles={chartDefinitions.map((definition) => ({
              id: definition.chart.id,
              /*
               * The chart's configured size is only where it STARTS now.
               * Once it has been resized on the canvas, that placement is
               * what holds.
               */
              defaultColumnSpan:
                definition.chart.size === "Large"
                  ? 12
                  : definition.chart.size === "Medium"
                  ? 8
                  : 4,
              defaultRowSpan: 12,
              content: (
                <div
                  data-t1eq-tile="true"
                  data-t1eq-qbit-type="tile"
                  data-t1eq-qbit-id={`dashboard-report-${definition.chart.id}`}
                  data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                  className="h-full"
                >
                  <OperationalDashboardChartRenderer
                    chart={definition.chart}
                    data={definition.data}
                  />
                </div>
              ),
            }))}
            onRemove={handleRemoveReportTile}
            menuItems={reportPickerItems}
            emptyState={
              <div
                data-t1eq-tile="true"
                data-t1eq-page-card="true"
                data-t1eq-qbit-type="tile"
                data-t1eq-qbit-id="dashboard-reports-empty"
                data-t1eq-qbit-scope={DASHBOARD_SCOPE}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center"
              >
                <p className="text-sm font-bold text-white/70">
                  No report tiles yet.
                </p>

                <p className="mt-1 text-sm font-semibold text-white/50">
                  Right-click here to add one, or use Configure Reports to
                  build a chart from your repair orders, invoices,
                  inventory, and purchase orders.
                </p>
              </div>
            }
          />
        </section>
      </div>
    </main>
  );
}