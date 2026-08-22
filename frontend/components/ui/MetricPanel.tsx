type MetricPanelProps = {
  title: string;

  metrics: {
    label: string;
    value: string | number;
  }[];
};

export default function MetricPanel({
  title,
  metrics,
}: MetricPanelProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-semibold">
        {title}
      </h2>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            key={metric.label}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-4"
          >
            <div className="text-sm text-slate-400">
              {metric.label}
            </div>

            <div className="text-lg font-semibold">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}