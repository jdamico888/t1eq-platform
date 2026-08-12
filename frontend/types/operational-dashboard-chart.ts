export type OperationalDashboardChartType = "Bar" | "Line" | "Histogram";

export type OperationalDashboardChartMetric =
  | "Repair Orders Total"
  | "Repair Orders Open"
  | "Repair Orders Waiting Parts"
  | "Repair Orders Completed"
  | "Dispatch Jobs Total"
  | "Dispatch Jobs Active"
  | "Invoices Total"
  | "Invoices Open"
  | "Invoices Paid"
  | "Inventory Items Total"
  | "Inventory Low Stock"
  | "Inventory Open Discrepancies"
  | "Inventory Total Discrepancies"
  | "Purchase Orders Total"
  | "Purchase Orders Open"
  | "Purchase Orders Ordered"
  | "Purchase Orders Received"
  | "Company Tools Total"
  | "Company Tools Available"
  | "Company Tools Assigned"
  | "Truck Stock Trucks"
  | "Customers Total"
  | "Equipment Total"
  | "Suppliers Total"
  | "Users Total";

export type OperationalDashboardChartTimeRange =
  | "Current Snapshot"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Month"
  | "This Quarter"
  | "This Year";

export type OperationalDashboardChartGroupBy =
  | "None"
  | "Status"
  | "Category"
  | "Day"
  | "Week"
  | "Month"
  | "Technician"
  | "Supplier"
  | "Customer"
  | "Truck";

export type OperationalDashboardChartSize = "Small" | "Medium" | "Large";

export type OperationalDashboardChartDataPoint = {
  label: string;
  value: number;
};

export type OperationalDashboardChart = {
  id: string;

  title: string;
  description?: string;

  chartType: OperationalDashboardChartType;
  metric: OperationalDashboardChartMetric;

  timeRange: OperationalDashboardChartTimeRange;
  groupBy: OperationalDashboardChartGroupBy;

  size: OperationalDashboardChartSize;

  showOnOperationsDashboard: boolean;

  sortOrder: number;

  createdDate: string;
  updatedDate?: string;
};

export type OperationalDashboardChartDefinition = {
  chart: OperationalDashboardChart;
  data: OperationalDashboardChartDataPoint[];
};