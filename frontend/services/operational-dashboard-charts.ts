import type {
  OperationalDashboardChart,
  OperationalDashboardChartDefinition,
  OperationalDashboardChartGroupBy,
  OperationalDashboardChartMetric,
  OperationalDashboardChartSize,
  OperationalDashboardChartTimeRange,
  OperationalDashboardChartType,
} from "@/types/operational-dashboard-chart";

const STORAGE_KEY = "t1eq-operational-dashboard-charts";

export const operationalDashboardChartTypes: OperationalDashboardChartType[] = [
  "Bar",
  "Line",
  "Histogram",
];

export const operationalDashboardChartMetrics: OperationalDashboardChartMetric[] =
  [
    "Repair Orders Total",
    "Repair Orders Open",
    "Repair Orders Waiting Parts",
    "Repair Orders Completed",
    "Dispatch Jobs Total",
    "Dispatch Jobs Active",
    "Invoices Total",
    "Invoices Open",
    "Invoices Paid",
    "Inventory Items Total",
    "Inventory Low Stock",
    "Inventory Open Discrepancies",
    "Inventory Total Discrepancies",
    "Purchase Orders Total",
    "Purchase Orders Open",
    "Purchase Orders Ordered",
    "Purchase Orders Received",
    "Company Tools Total",
    "Company Tools Available",
    "Company Tools Assigned",
    "Truck Stock Trucks",
    "Customers Total",
    "Equipment Total",
    "Suppliers Total",
    "Users Total",
  ];

export const operationalDashboardChartTimeRanges: OperationalDashboardChartTimeRange[] =
  [
    "Current Snapshot",
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "This Quarter",
    "This Year",
  ];

export const operationalDashboardChartGroupByOptions: OperationalDashboardChartGroupBy[] =
  [
    "None",
    "Status",
    "Category",
    "Day",
    "Week",
    "Month",
    "Technician",
    "Supplier",
    "Customer",
    "Truck",
  ];

export const operationalDashboardChartSizes: OperationalDashboardChartSize[] = [
  "Small",
  "Medium",
  "Large",
];

const defaultOperationalDashboardCharts: OperationalDashboardChart[] = [
  {
    id: "default-inventory-risk",
    title: "Inventory Risk Snapshot",
    description:
      "Low stock and inventory discrepancy pressure shown as an operational bar chart.",
    chartType: "Bar",
    metric: "Inventory Low Stock",
    timeRange: "Current Snapshot",
    groupBy: "Category",
    size: "Medium",
    showOnOperationsDashboard: true,
    sortOrder: 10,
    createdDate: new Date().toISOString(),
  },
  {
    id: "default-po-status",
    title: "Purchase Order Status",
    description:
      "Current purchase order workload split by open, ordered, and received status.",
    chartType: "Bar",
    metric: "Purchase Orders Total",
    timeRange: "Current Snapshot",
    groupBy: "Status",
    size: "Medium",
    showOnOperationsDashboard: true,
    sortOrder: 20,
    createdDate: new Date().toISOString(),
  },
];

function createId(prefix = "CHART") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function isChartType(value: unknown): value is OperationalDashboardChartType {
  return (
    value === "Bar" ||
    value === "Line" ||
    value === "Histogram"
  );
}

function isChartMetric(
  value: unknown
): value is OperationalDashboardChartMetric {
  return operationalDashboardChartMetrics.includes(
    value as OperationalDashboardChartMetric
  );
}

function isChartTimeRange(
  value: unknown
): value is OperationalDashboardChartTimeRange {
  return operationalDashboardChartTimeRanges.includes(
    value as OperationalDashboardChartTimeRange
  );
}

function isChartGroupBy(
  value: unknown
): value is OperationalDashboardChartGroupBy {
  return operationalDashboardChartGroupByOptions.includes(
    value as OperationalDashboardChartGroupBy
  );
}

function isChartSize(value: unknown): value is OperationalDashboardChartSize {
  return operationalDashboardChartSizes.includes(
    value as OperationalDashboardChartSize
  );
}

function normalizeChart(
  chart: Partial<OperationalDashboardChart>,
  index = 0
): OperationalDashboardChart {
  const now = createTimestamp();

  return {
    id: chart.id ?? createId(),

    title: chart.title?.trim() || "Dashboard Chart",
    description: chart.description?.trim() || undefined,

    chartType: isChartType(chart.chartType) ? chart.chartType : "Bar",
    metric: isChartMetric(chart.metric)
      ? chart.metric
      : "Repair Orders Total",

    timeRange: isChartTimeRange(chart.timeRange)
      ? chart.timeRange
      : "Current Snapshot",

    groupBy: isChartGroupBy(chart.groupBy) ? chart.groupBy : "None",

    size: isChartSize(chart.size) ? chart.size : "Medium",

    showOnOperationsDashboard:
      chart.showOnOperationsDashboard === undefined
        ? true
        : Boolean(chart.showOnOperationsDashboard),

    sortOrder:
      typeof chart.sortOrder === "number" && Number.isFinite(chart.sortOrder)
        ? chart.sortOrder
        : index + 1,

    createdDate: chart.createdDate ?? now,
    updatedDate: chart.updatedDate,
  };
}

function readChartStorage(): OperationalDashboardChart[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return defaultOperationalDashboardCharts;
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return defaultOperationalDashboardCharts;
    }

    return parsedValue
      .map((chart, index) =>
        normalizeChart(chart as Partial<OperationalDashboardChart>, index)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (error) {
    console.error("Failed to parse operational dashboard charts.", error);

    return defaultOperationalDashboardCharts;
  }
}

function writeChartStorage(charts: OperationalDashboardChart[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  window.dispatchEvent(new Event("t1eq-operational-dashboard-charts-changed"));
}

export function getOperationalDashboardCharts(): OperationalDashboardChart[] {
  return readChartStorage();
}

export function getVisibleOperationalDashboardCharts(): OperationalDashboardChart[] {
  return getOperationalDashboardCharts()
    .filter((chart) => chart.showOnOperationsDashboard)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function saveOperationalDashboardCharts(
  charts: OperationalDashboardChart[]
): OperationalDashboardChart[] {
  const normalizedCharts = charts
    .map((chart, index) => normalizeChart(chart, index))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  writeChartStorage(normalizedCharts);

  return normalizedCharts;
}

export function createOperationalDashboardChart(
  input: Partial<OperationalDashboardChart>
): OperationalDashboardChart {
  const now = createTimestamp();

  const currentCharts = getOperationalDashboardCharts();

  const newChart = normalizeChart({
    ...input,
    id: input.id ?? createId(),
    createdDate: input.createdDate ?? now,
    updatedDate: now,
    sortOrder:
      typeof input.sortOrder === "number"
        ? input.sortOrder
        : currentCharts.length + 1,
  });

  saveOperationalDashboardCharts([...currentCharts, newChart]);

  return newChart;
}

export function updateOperationalDashboardChart(
  chartId: string,
  updates: Partial<OperationalDashboardChart>
): OperationalDashboardChart | null {
  const currentCharts = getOperationalDashboardCharts();

  const existingChart = currentCharts.find((chart) => chart.id === chartId);

  if (!existingChart) {
    return null;
  }

  const updatedChart = normalizeChart({
    ...existingChart,
    ...updates,
    id: existingChart.id,
    createdDate: existingChart.createdDate,
    updatedDate: createTimestamp(),
  });

  const nextCharts = currentCharts.map((chart) =>
    chart.id === chartId ? updatedChart : chart
  );

  saveOperationalDashboardCharts(nextCharts);

  return updatedChart;
}

export function deleteOperationalDashboardChart(
  chartId: string
): OperationalDashboardChart[] {
  const nextCharts = getOperationalDashboardCharts().filter(
    (chart) => chart.id !== chartId
  );

  return saveOperationalDashboardCharts(nextCharts);
}

export function getOperationalDashboardChartById(chartId: string) {
  return (
    getOperationalDashboardCharts().find((chart) => chart.id === chartId) ??
    null
  );
}

export function buildOperationalDashboardChartDefinition(
  chart: OperationalDashboardChart,
  data: OperationalDashboardChartDefinition["data"]
): OperationalDashboardChartDefinition {
  return {
    chart: normalizeChart(chart),
    data,
  };
}

export function resetOperationalDashboardCharts(): OperationalDashboardChart[] {
  const resetCharts = defaultOperationalDashboardCharts.map((chart, index) =>
    normalizeChart(
      {
        ...chart,
        createdDate: createTimestamp(),
        updatedDate: createTimestamp(),
      },
      index
    )
  );

  writeChartStorage(resetCharts);

  return resetCharts;
}