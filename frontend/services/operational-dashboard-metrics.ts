import type {
  OperationalDashboardChart,
  OperationalDashboardChartDataPoint,
  OperationalDashboardChartGroupBy,
  OperationalDashboardChartMetric,
  OperationalDashboardChartTimeRange,
} from "@/types/operational-dashboard-chart";

import { getRepairOrders } from "@/services/repair-orders";
import { getDispatchJobs } from "@/services/dispatch";
import { getInvoices } from "@/services/invoices";
import {
  getInventoryItems,
  getLowStockItems,
} from "@/services/inventory";
import {
  getInventoryDiscrepancies,
  getOpenInventoryDiscrepancies,
} from "@/services/inventory-discrepancies";
import { getPurchaseOrders } from "@/services/purchase-orders";
import { getCompanyTools } from "@/services/company-tools";
import { getTrucks } from "@/services/truck-stock";
import { getCustomers } from "@/services/customers";
import { getEquipment } from "@/services/equipment";
import { getSuppliers } from "@/services/suppliers";
import { getTechnicianProfiles } from "@/services/technician-profiles";

/**
 * The chart system stores what to chart; this turns that into numbers.
 *
 * Every metric is normalized into the same shape first, so one grouping
 * routine serves all of them rather than each metric growing its own.
 * A record only fills in the dimensions it actually has — grouping by a
 * dimension a record lacks lands it under "Unassigned" rather than
 * inventing a value.
 */
type MetricRecord = {
  date?: string;
  status?: string;
  category?: string;
  technician?: string;
  supplier?: string;
  customer?: string;
  truck?: string;
};

const UNASSIGNED_LABEL = "Unassigned";

function normalizeStatus(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : undefined;
}

/* =========================================================
   SOURCES — one per metric, each returning MetricRecords
   ========================================================= */

function repairOrderRecords(): MetricRecord[] {
  return getRepairOrders().map((repairOrder) => ({
    date: repairOrder.openedDate ?? repairOrder.createdDate,
    status: normalizeStatus(repairOrder.status),
    technician:
      repairOrder.assignedTechnicianName ??
      repairOrder.assignedEmployeeDisplayName,
    customer: repairOrder.customerName,
    truck: repairOrder.assignedTruckName,
  }));
}

function invoiceRecords(): MetricRecord[] {
  return getInvoices().map((invoice) => ({
    date: invoice.invoiceDate ?? invoice.createdDate,
    status: normalizeStatus(invoice.status),
    customer: invoice.customerName,
  }));
}

function dispatchRecords(): MetricRecord[] {
  return getDispatchJobs().map((job) => ({
    date: job.scheduledStart ?? job.createdDate,
    status: normalizeStatus(job.status),
    technician: job.technicianName,
    customer: job.customerName,
  }));
}

function inventoryRecords(
  items: ReturnType<typeof getInventoryItems>
): MetricRecord[] {
  return items.map((item) => ({
    date: item.createdDate,
    status: item.quantityOnHand <= item.minimumQuantity ? "Low" : "In Stock",
    category: item.manufacturer,
    supplier: item.supplierName,
  }));
}

function discrepancyRecords(
  discrepancies: ReturnType<typeof getInventoryDiscrepancies>
): MetricRecord[] {
  return discrepancies.map((discrepancy) => ({
    date: discrepancy.createdDate,
    status: normalizeStatus(discrepancy.status),
    category: discrepancy.source,
  }));
}

function purchaseOrderRecords(): MetricRecord[] {
  return getPurchaseOrders().map((purchaseOrder) => ({
    date:
      purchaseOrder.orderDate ??
      purchaseOrder.orderedDate ??
      purchaseOrder.createdDate,
    status: normalizeStatus(purchaseOrder.status),
    supplier: purchaseOrder.supplierName ?? purchaseOrder.supplier,
  }));
}

function companyToolRecords(): MetricRecord[] {
  return getCompanyTools().map((tool) => ({
    date: tool.purchaseDate ?? tool.createdDate,
    status: normalizeStatus(tool.status),
    category: tool.manufacturer,
    technician: tool.assignedToName,
    truck: tool.locationName,
  }));
}

function truckRecords(): MetricRecord[] {
  return getTrucks().map((truck) => ({
    date: truck.createdDate,
    status: normalizeStatus(truck.status),
    technician: truck.assignedTechnicianName,
    truck: truck.name,
  }));
}

function customerRecords(): MetricRecord[] {
  return getCustomers().map((customer) => ({
    date: customer.createdDate,
    customer: customer.name,
    category: customer.state,
  }));
}

function equipmentRecords(): MetricRecord[] {
  return getEquipment().map((equipment) => ({
    date: equipment.createdDate,
    status: normalizeStatus(equipment.status),
    category: equipment.category ?? equipment.manufacturer,
    customer: equipment.customerName,
  }));
}

function supplierRecords(): MetricRecord[] {
  return getSuppliers().map((supplier) => ({
    date: supplier.createdDate,
    supplier: supplier.name,
    category: supplier.state,
  }));
}

function technicianRecords(): MetricRecord[] {
  return getTechnicianProfiles().map((profile) => ({
    date: profile.createdDate,
    status: normalizeStatus(profile.status),
    technician: profile.displayName,
  }));
}

function matchesStatus(
  record: MetricRecord,
  ...needles: string[]
): boolean {
  const status = (record.status ?? "").toLowerCase();

  return needles.some((needle) =>
    status.includes(needle.toLowerCase())
  );
}

/**
 * Repair orders and invoices that are still live — anything not finished,
 * cancelled, or written off.
 */
function isOpenRepairOrder(record: MetricRecord): boolean {
  return !matchesStatus(
    record,
    "Completed",
    "Closed",
    "Invoiced",
    "Cancelled"
  );
}

function getMetricRecords(
  metric: OperationalDashboardChartMetric
): MetricRecord[] {
  switch (metric) {
    case "Repair Orders Total":
      return repairOrderRecords();
    case "Repair Orders Open":
      return repairOrderRecords().filter(isOpenRepairOrder);
    case "Repair Orders Waiting Parts":
      return repairOrderRecords().filter((record) =>
        matchesStatus(record, "Waiting Parts", "Waiting on Parts")
      );
    case "Repair Orders Completed":
      return repairOrderRecords().filter((record) =>
        matchesStatus(record, "Completed")
      );

    case "Dispatch Jobs Total":
      return dispatchRecords();
    case "Dispatch Jobs Active":
      return dispatchRecords().filter(
        (record) =>
          !matchesStatus(record, "Completed", "Cancelled", "Closed")
      );

    case "Invoices Total":
      return invoiceRecords();
    case "Invoices Open":
      return invoiceRecords().filter(
        (record) =>
          !matchesStatus(record, "Paid", "Void", "Cancelled")
      );
    case "Invoices Paid":
      return invoiceRecords().filter((record) =>
        matchesStatus(record, "Paid")
      );

    case "Inventory Items Total":
      return inventoryRecords(getInventoryItems());
    case "Inventory Low Stock":
      return inventoryRecords(getLowStockItems());
    case "Inventory Open Discrepancies":
      return discrepancyRecords(getOpenInventoryDiscrepancies());
    case "Inventory Total Discrepancies":
      return discrepancyRecords(getInventoryDiscrepancies());

    case "Purchase Orders Total":
      return purchaseOrderRecords();
    case "Purchase Orders Open":
      return purchaseOrderRecords().filter(
        (record) =>
          !matchesStatus(record, "Received", "Closed", "Cancelled")
      );
    case "Purchase Orders Ordered":
      return purchaseOrderRecords().filter((record) =>
        matchesStatus(record, "Ordered")
      );
    case "Purchase Orders Received":
      return purchaseOrderRecords().filter((record) =>
        matchesStatus(record, "Received")
      );

    case "Company Tools Total":
      return companyToolRecords();
    case "Company Tools Available":
      return companyToolRecords().filter((record) =>
        matchesStatus(record, "Available")
      );
    case "Company Tools Assigned":
      return companyToolRecords().filter((record) =>
        matchesStatus(record, "Assigned")
      );

    case "Truck Stock Trucks":
      return truckRecords();

    case "Customers Total":
      return customerRecords();
    case "Equipment Total":
      return equipmentRecords();
    case "Suppliers Total":
      return supplierRecords();

    // The old standalone Users store was removed; employee records are the
    // people in the system now.
    case "Users Total":
      return technicianRecords();

    default:
      return [];
  }
}

/* =========================================================
   TIME RANGE
   ========================================================= */

function getRangeStart(
  timeRange: OperationalDashboardChartTimeRange,
  now: Date
): Date | null {
  switch (timeRange) {
    case "Last 7 Days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }
    case "Last 30 Days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start;
    }
    case "This Month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "This Quarter":
      return new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1
      );
    case "This Year":
      return new Date(now.getFullYear(), 0, 1);
    case "Current Snapshot":
    default:
      return null;
  }
}

function filterByTimeRange(
  records: MetricRecord[],
  timeRange: OperationalDashboardChartTimeRange
): MetricRecord[] {
  const rangeStart = getRangeStart(timeRange, new Date());

  if (!rangeStart) {
    return records;
  }

  const startTime = rangeStart.getTime();

  return records.filter((record) => {
    if (!record.date) {
      // A record with no date cannot be placed in time — leaving it out
      // beats padding a trend with records that may be years old.
      return false;
    }

    const recordTime = new Date(record.date).getTime();

    return !Number.isNaN(recordTime) && recordTime >= startTime;
  });
}

/* =========================================================
   GROUPING
   ========================================================= */

function getWeekLabel(date: Date): string {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());

  return `Wk of ${startOfWeek.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function getGroupLabel(
  record: MetricRecord,
  groupBy: OperationalDashboardChartGroupBy
): string {
  switch (groupBy) {
    case "Status":
      return record.status ?? UNASSIGNED_LABEL;
    case "Category":
      return record.category ?? UNASSIGNED_LABEL;
    case "Technician":
      return record.technician ?? UNASSIGNED_LABEL;
    case "Supplier":
      return record.supplier ?? UNASSIGNED_LABEL;
    case "Customer":
      return record.customer ?? UNASSIGNED_LABEL;
    case "Truck":
      return record.truck ?? UNASSIGNED_LABEL;

    case "Day":
    case "Week":
    case "Month": {
      if (!record.date) {
        return UNASSIGNED_LABEL;
      }

      const date = new Date(record.date);

      if (Number.isNaN(date.getTime())) {
        return UNASSIGNED_LABEL;
      }

      if (groupBy === "Day") {
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }

      if (groupBy === "Week") {
        return getWeekLabel(date);
      }

      return date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    }

    case "None":
    default:
      return "Total";
  }
}

/**
 * Time buckets read as a sequence, so they stay in date order. Everything
 * else is a comparison, so the biggest bar goes first.
 */
function sortDataPoints(
  dataPoints: OperationalDashboardChartDataPoint[],
  groupBy: OperationalDashboardChartGroupBy,
  chronologicalOrder: string[]
): OperationalDashboardChartDataPoint[] {
  const isTimeGrouping =
    groupBy === "Day" || groupBy === "Week" || groupBy === "Month";

  if (isTimeGrouping) {
    return [...dataPoints].sort(
      (a, b) =>
        chronologicalOrder.indexOf(a.label) -
        chronologicalOrder.indexOf(b.label)
    );
  }

  return [...dataPoints].sort((a, b) => b.value - a.value);
}

/**
 * Turns a saved chart into the points the renderer draws.
 */
export function resolveOperationalDashboardChartData(
  chart: OperationalDashboardChart
): OperationalDashboardChartDataPoint[] {
  const records = filterByTimeRange(
    getMetricRecords(chart.metric),
    chart.timeRange
  );

  const counts = new Map<string, number>();

  // Remembers the order labels were first seen, once records are in date
  // order — that becomes the left-to-right order for time buckets.
  const datedRecords = [...records].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;

    return aTime - bTime;
  });

  const chronologicalOrder: string[] = [];

  datedRecords.forEach((record) => {
    const label = getGroupLabel(record, chart.groupBy);

    if (!chronologicalOrder.includes(label)) {
      chronologicalOrder.push(label);
    }

    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  const dataPoints: OperationalDashboardChartDataPoint[] = Array.from(
    counts.entries()
  ).map(([label, value]) => ({ label, value }));

  return sortDataPoints(dataPoints, chart.groupBy, chronologicalOrder);
}
