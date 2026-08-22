"use client";

import type {
  OperationalDashboardChart,
  OperationalDashboardChartDataPoint,
} from "@/types/operational-dashboard-chart";

type OperationalDashboardChartRendererProps = {
  chart: OperationalDashboardChart;
  data: OperationalDashboardChartDataPoint[];
};

const wrapperClass =
  "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm";

const titleClass = "text-lg font-black text-black";

const descriptionClass = "mt-1 text-sm font-semibold text-zinc-600";

const emptyClass =
  "mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-500";

function getMaxValue(data: OperationalDashboardChartDataPoint[]) {
  const maxValue = Math.max(...data.map((point) => point.value), 0);

  if (maxValue <= 0) {
    return 1;
  }

  return maxValue;
}

function getChartSizeClass(size: OperationalDashboardChart["size"]) {
  if (size === "Small") {
    return "md:col-span-1";
  }

  if (size === "Large") {
    return "md:col-span-2 xl:col-span-3";
  }

  return "md:col-span-1 xl:col-span-2";
}

function BarChart({
  data,
}: {
  data: OperationalDashboardChartDataPoint[];
}) {
  const maxValue = getMaxValue(data);

  return (
    <div className="mt-5 space-y-3">
      {data.map((point) => {
        const widthPercentage = Math.max(4, (point.value / maxValue) * 100);

        return (
          <div key={point.label}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-black text-zinc-700">
                {point.label}
              </span>

              <span className="text-sm font-black text-black">
                {point.value}
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-black"
                style={{
                  width: `${widthPercentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistogramChart({
  data,
}: {
  data: OperationalDashboardChartDataPoint[];
}) {
  const maxValue = getMaxValue(data);

  return (
    <div className="mt-5">
      <div data-t1eq-tile="true" data-t1eq-page-card="true" className="flex h-44 items-end gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        {data.map((point) => {
          const heightPercentage = Math.max(6, (point.value / maxValue) * 100);

          return (
            <div
              key={point.label}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="text-xs font-black text-black">
                {point.value}
              </div>

              <div
                className="w-full rounded-t-xl bg-black"
                style={{
                  height: `${heightPercentage}%`,
                }}
              />

              <div className="max-w-full truncate text-xs font-bold text-zinc-500">
                {point.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({
  data,
}: {
  data: OperationalDashboardChartDataPoint[];
}) {
  const maxValue = getMaxValue(data);
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingX = 36;
  const paddingY = 28;
  const drawableWidth = chartWidth - paddingX * 2;
  const drawableHeight = chartHeight - paddingY * 2;

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : paddingX + (index / (data.length - 1)) * drawableWidth;

    const y =
      chartHeight -
      paddingY -
      Math.max(0, Math.min(1, point.value / maxValue)) * drawableHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Line chart"
        className="h-auto w-full"
      >
        <line
          x1={paddingX}
          y1={chartHeight - paddingY}
          x2={chartWidth - paddingX}
          y2={chartHeight - paddingY}
          stroke="currentColor"
          className="text-zinc-300"
          strokeWidth="2"
        />

        <line
          x1={paddingX}
          y1={paddingY}
          x2={paddingX}
          y2={chartHeight - paddingY}
          stroke="currentColor"
          className="text-zinc-300"
          strokeWidth="2"
        />

        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          className="text-black"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="currentColor"
              className="text-black"
            />

            <text
              x={point.x}
              y={Math.max(16, point.y - 12)}
              textAnchor="middle"
              className="fill-black text-[20px] font-black"
            >
              {point.value}
            </text>

            <text
              x={point.x}
              y={chartHeight - 6}
              textAnchor="middle"
              className="fill-zinc-500 text-[16px] font-bold"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function OperationalDashboardChartRenderer({
  chart,
  data,
}: OperationalDashboardChartRendererProps) {
  return (
    <section
      data-t1eq-page-card="true"
      className={`${wrapperClass} ${getChartSizeClass(chart.size)}`}
    >
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h3 className={titleClass}>{chart.title}</h3>

          {chart.description && (
            <p className={descriptionClass}>{chart.description}</p>
          )}
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-600">
          {chart.chartType}
        </div>
      </div>

      {data.length === 0 ? (
        <div className={emptyClass}>No chart data available.</div>
      ) : (
        <>
          {chart.chartType === "Bar" && <BarChart data={data} />}

          {chart.chartType === "Histogram" && <HistogramChart data={data} />}

          {chart.chartType === "Line" && <LineChart data={data} />}
        </>
      )}
    </section>
  );
}