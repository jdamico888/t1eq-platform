"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  OperationalDashboardChart,
  OperationalDashboardChartGroupBy,
  OperationalDashboardChartMetric,
  OperationalDashboardChartSize,
  OperationalDashboardChartTimeRange,
  OperationalDashboardChartType,
} from "@/types/operational-dashboard-chart";

import {
  createOperationalDashboardChart,
  deleteOperationalDashboardChart,
  getOperationalDashboardCharts,
  operationalDashboardChartGroupByOptions,
  operationalDashboardChartMetrics,
  operationalDashboardChartSizes,
  operationalDashboardChartTimeRanges,
  operationalDashboardChartTypes,
  resetOperationalDashboardCharts,
  updateOperationalDashboardChart,
} from "@/services/operational-dashboard-charts";

type ChartFormState = {
  id: string;
  title: string;
  description: string;
  chartType: OperationalDashboardChartType;
  metric: OperationalDashboardChartMetric;
  timeRange: OperationalDashboardChartTimeRange;
  groupBy: OperationalDashboardChartGroupBy;
  size: OperationalDashboardChartSize;
  showOnOperationsDashboard: boolean;
  sortOrder: string;
};

const pageClass = "min-h-screen bg-zinc-100 p-6 text-black";

const headerClass =
  "mb-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";

const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const selectClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/10";

const labelClass = "text-sm font-black uppercase tracking-wide text-zinc-500";

const primaryButtonClass =
  "rounded-xl bg-black px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-zinc-800";

const secondaryButtonClass =
  "rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-black shadow-sm transition hover:bg-zinc-50";

const dangerButtonClass =
  "rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-100";

const tableHeaderClass =
  "border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-zinc-500";

const tableCellClass =
  "border-b border-zinc-100 px-4 py-3 text-sm text-zinc-700";

const badgeClass =
  "inline-flex rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-700";

const enabledBadgeClass =
  "inline-flex rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-black text-green-700";

const disabledBadgeClass =
  "inline-flex rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs font-black text-zinc-500";

function createEmptyFormState(): ChartFormState {
  return {
    id: "",
    title: "",
    description: "",
    chartType: "Bar",
    metric: "Inventory Low Stock",
    timeRange: "Current Snapshot",
    groupBy: "Category",
    size: "Medium",
    showOnOperationsDashboard: true,
    sortOrder: "1",
  };
}

function convertChartToFormState(chart: OperationalDashboardChart): ChartFormState {
  return {
    id: chart.id,
    title: chart.title,
    description: chart.description ?? "",
    chartType: chart.chartType,
    metric: chart.metric,
    timeRange: chart.timeRange,
    groupBy: chart.groupBy,
    size: chart.size,
    showOnOperationsDashboard: chart.showOnOperationsDashboard,
    sortOrder: String(chart.sortOrder),
  };
}

function parseSortOrder(value: string) {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return 1;
  }

  return parsedValue;
}

function chartMatchesSearch(chart: OperationalDashboardChart, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableValues = [
    chart.title,
    chart.description,
    chart.chartType,
    chart.metric,
    chart.timeRange,
    chart.groupBy,
    chart.size,
  ];

  return searchableValues.some((value) =>
    value?.toLowerCase().includes(normalizedSearch)
  );
}

export default function OperationalDashboardChartsSettingsPage() {
  const [charts, setCharts] = useState<OperationalDashboardChart[]>([]);
  const [formState, setFormState] = useState<ChartFormState>(
    createEmptyFormState()
  );
  const [showForm, setShowForm] = useState(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  function refreshCharts() {
    setCharts(getOperationalDashboardCharts());
  }

  useEffect(() => {
    refreshCharts();
  }, []);

  const editingChart = useMemo(
    () => charts.find((chart) => chart.id === editingChartId) ?? null,
    [charts, editingChartId]
  );

  const filteredCharts = useMemo(
    () => charts.filter((chart) => chartMatchesSearch(chart, searchTerm)),
    [charts, searchTerm]
  );

  function updateFormState(updates: Partial<ChartFormState>) {
    setFormState((current) => ({
      ...current,
      ...updates,
    }));
    setStatusMessage("");
  }

  function beginCreateChart() {
    setEditingChartId(null);
    setFormState({
      ...createEmptyFormState(),
      sortOrder: String(charts.length + 1),
    });
    setShowForm(true);
    setStatusMessage("");
  }

  function beginEditChart(chart: OperationalDashboardChart) {
    setEditingChartId(chart.id);
    setFormState(convertChartToFormState(chart));
    setShowForm(true);
    setStatusMessage("");
  }

  function cancelForm() {
    setEditingChartId(null);
    setFormState(createEmptyFormState());
    setShowForm(false);
    setStatusMessage("");
  }

  function handleSaveChart() {
    if (!formState.title.trim()) {
      setStatusMessage("Chart title is required.");
      return;
    }

    const chartInput: Partial<OperationalDashboardChart> = {
      title: formState.title.trim(),
      description: formState.description.trim() || undefined,
      chartType: formState.chartType,
      metric: formState.metric,
      timeRange: formState.timeRange,
      groupBy: formState.groupBy,
      size: formState.size,
      showOnOperationsDashboard: formState.showOnOperationsDashboard,
      sortOrder: parseSortOrder(formState.sortOrder),
    };

    if (editingChart) {
      updateOperationalDashboardChart(editingChart.id, chartInput);
      setStatusMessage("Dashboard chart updated.");
    } else {
      createOperationalDashboardChart(chartInput);
      setStatusMessage("Dashboard chart created.");
    }

    refreshCharts();
    cancelForm();
  }

  function handleDeleteChart(chart: OperationalDashboardChart) {
    const confirmed = window.confirm(`Delete chart "${chart.title}"?`);

    if (!confirmed) {
      return;
    }

    deleteOperationalDashboardChart(chart.id);
    refreshCharts();
    setStatusMessage("Dashboard chart deleted.");

    if (editingChartId === chart.id) {
      cancelForm();
    }
  }

  function handleToggleDashboardVisibility(chart: OperationalDashboardChart) {
    updateOperationalDashboardChart(chart.id, {
      showOnOperationsDashboard: !chart.showOnOperationsDashboard,
    });

    refreshCharts();
    setStatusMessage(
      chart.showOnOperationsDashboard
        ? "Chart hidden from Operations Dashboard."
        : "Chart shown on Operations Dashboard."
    );
  }

  function handleResetCharts() {
    const confirmed = window.confirm(
      "Reset dashboard charts back to the default chart set?"
    );

    if (!confirmed) {
      return;
    }

    resetOperationalDashboardCharts();
    refreshCharts();
    cancelForm();
    setStatusMessage("Dashboard charts reset to defaults.");
  }

  return (
    <div className={pageClass}>
      <header data-t1eq-page-card="true" className={headerClass}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-zinc-500">
              Settings
            </p>

            <h1 className="mt-2 text-4xl font-black text-black">
              Operational Dashboard Charts
            </h1>

            <p className="mt-2 max-w-4xl text-base font-semibold text-zinc-600">
              Build dashboard charts for measurable operational information.
              Charts can be bar charts, line charts, or histograms and can be
              shown directly on the Operations Dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/dashboard" className={secondaryButtonClass}>
              Open Dashboard
            </a>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={beginCreateChart}
              className={primaryButtonClass}
            >
              Add Chart
            </button>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={handleResetCharts}
              className={secondaryButtonClass}
            >
              Reset Defaults
            </button>
          </div>
        </div>

        {statusMessage && (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-700">
            {statusMessage}
          </div>
        )}
      </header>

      {showForm && (
        <section data-t1eq-page-card="true" className={`${sectionClass} mb-6`}>
          <div className="mb-5">
            <h2 className="text-2xl font-black text-black">
              {editingChart ? "Edit Dashboard Chart" : "Add Dashboard Chart"}
            </h2>

            <p className="mt-1 text-sm font-semibold text-zinc-600">
              Select the chart type, metric, grouping, size, and whether it
              should appear on the Operations Dashboard.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>Chart Title</span>
              <input data-t1eq-field="true"
                value={formState.title}
                onChange={(event) =>
                  updateFormState({
                    title: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Example: Inventory Risk Snapshot"
              />
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Chart Type</span>
              <select data-t1eq-field="true"
                value={formState.chartType}
                onChange={(event) =>
                  updateFormState({
                    chartType: event.target.value as OperationalDashboardChartType,
                  })
                }
                className={selectClass}
              >
                {operationalDashboardChartTypes.map((chartType) => (
                  <option key={chartType} value={chartType}>
                    {chartType}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Size</span>
              <select data-t1eq-field="true"
                value={formState.size}
                onChange={(event) =>
                  updateFormState({
                    size: event.target.value as OperationalDashboardChartSize,
                  })
                }
                className={selectClass}
              >
                {operationalDashboardChartSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className={labelClass}>Metric</span>
              <select data-t1eq-field="true"
                value={formState.metric}
                onChange={(event) =>
                  updateFormState({
                    metric: event.target
                      .value as OperationalDashboardChartMetric,
                  })
                }
                className={selectClass}
              >
                {operationalDashboardChartMetrics.map((metric) => (
                  <option key={metric} value={metric}>
                    {metric}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Time Range</span>
              <select data-t1eq-field="true"
                value={formState.timeRange}
                onChange={(event) =>
                  updateFormState({
                    timeRange: event.target
                      .value as OperationalDashboardChartTimeRange,
                  })
                }
                className={selectClass}
              >
                {operationalDashboardChartTimeRanges.map((timeRange) => (
                  <option key={timeRange} value={timeRange}>
                    {timeRange}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Group By</span>
              <select data-t1eq-field="true"
                value={formState.groupBy}
                onChange={(event) =>
                  updateFormState({
                    groupBy: event.target.value as OperationalDashboardChartGroupBy,
                  })
                }
                className={selectClass}
              >
                {operationalDashboardChartGroupByOptions.map((groupBy) => (
                  <option key={groupBy} value={groupBy}>
                    {groupBy}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelClass}>Sort Order</span>
              <input data-t1eq-field="true"
                type="number"
                value={formState.sortOrder}
                onChange={(event) =>
                  updateFormState({
                    sortOrder: event.target.value,
                  })
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2 md:col-span-2 xl:col-span-4">
              <span className={labelClass}>Description</span>
              <textarea data-t1eq-field="true"
                value={formState.description}
                onChange={(event) =>
                  updateFormState({
                    description: event.target.value,
                  })
                }
                rows={3}
                className={inputClass}
                placeholder="Explain what this chart is showing."
              />
            </label>

            <label data-t1eq-tile="true" data-t1eq-page-card="true" className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:col-span-2 xl:col-span-4">
              <input data-t1eq-field="true"
                type="checkbox"
                checked={formState.showOnOperationsDashboard}
                onChange={(event) =>
                  updateFormState({
                    showOnOperationsDashboard: event.target.checked,
                  })
                }
                className="h-5 w-5"
              />

              <span className="text-sm font-black text-black">
                Show this chart on the Operations Dashboard
              </span>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button data-t1eq-action-button="true"
              type="button"
              onClick={handleSaveChart}
              className={primaryButtonClass}
            >
              {editingChart ? "Save Chart" : "Create Chart"}
            </button>

            <button data-t1eq-action-button="true"
              type="button"
              onClick={cancelForm}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section data-t1eq-page-card="true" className={sectionClass}>
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-black">
              Saved Dashboard Charts
            </h2>

            <p className="mt-1 text-sm font-semibold text-zinc-600">
              Manage the chart definitions that can appear on the Operations
              Dashboard.
            </p>
          </div>

          <label className="w-full space-y-2 md:w-96">
            <span className={labelClass}>Search Charts</span>
            <input data-t1eq-field="true"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className={inputClass}
              placeholder="Search title, metric, type, group, or size."
            />
          </label>
        </div>

        {filteredCharts.length === 0 ? (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500">
            No dashboard charts found.
          </div>
        ) : (
          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Chart</th>
                  <th className={tableHeaderClass}>Type</th>
                  <th className={tableHeaderClass}>Metric</th>
                  <th className={tableHeaderClass}>Group By</th>
                  <th className={tableHeaderClass}>Time Range</th>
                  <th className={tableHeaderClass}>Size</th>
                  <th className={tableHeaderClass}>Dashboard</th>
                  <th className={tableHeaderClass}>Sort</th>
                  <th className={tableHeaderClass}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCharts.map((chart) => (
                  <tr key={chart.id} className="transition hover:bg-zinc-50">
                    <td className={tableCellClass}>
                      <div className="font-black text-black">{chart.title}</div>

                      {chart.description && (
                        <div className="mt-1 text-xs font-semibold text-zinc-500">
                          {chart.description}
                        </div>
                      )}
                    </td>

                    <td className={tableCellClass}>
                      <span className={badgeClass}>{chart.chartType}</span>
                    </td>

                    <td className={tableCellClass}>{chart.metric}</td>

                    <td className={tableCellClass}>{chart.groupBy}</td>

                    <td className={tableCellClass}>{chart.timeRange}</td>

                    <td className={tableCellClass}>{chart.size}</td>

                    <td className={tableCellClass}>
                      <span
                        className={
                          chart.showOnOperationsDashboard
                            ? enabledBadgeClass
                            : disabledBadgeClass
                        }
                      >
                        {chart.showOnOperationsDashboard ? "Shown" : "Hidden"}
                      </span>
                    </td>

                    <td className={tableCellClass}>{chart.sortOrder}</td>

                    <td className={tableCellClass}>
                      <div className="flex flex-wrap gap-2">
                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() => beginEditChart(chart)}
                          className={secondaryButtonClass}
                        >
                          Edit
                        </button>

                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() =>
                            handleToggleDashboardVisibility(chart)
                          }
                          className={secondaryButtonClass}
                        >
                          {chart.showOnOperationsDashboard ? "Hide" : "Show"}
                        </button>

                        <button data-t1eq-action-button="true"
                          type="button"
                          onClick={() => handleDeleteChart(chart)}
                          className={dangerButtonClass}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}