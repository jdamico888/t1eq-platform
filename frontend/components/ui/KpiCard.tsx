type KpiCardProps = {
  label: string;

  value: string | number;

  change?: string;

  trend?: "up" | "down" | "neutral";

  subtitle?: string;
};

function getTrendClasses(
  trend?: string
): string {
  switch (trend) {
    case "up":
      return "text-emerald-300";

    case "down":
      return "text-red-300";

    default:
      return "text-slate-400";
  }
}

export default function KpiCard({
  label,
  value,
  change,
  trend = "neutral",
  subtitle,
}: KpiCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl">
      <div className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-3 text-4xl font-bold tracking-tight">
        {value}
      </div>

      {(change || subtitle) && (
        <div className="mt-3 flex items-center justify-between gap-4">
          {change && (
            <div
              className={`text-sm font-medium ${getTrendClasses(
                trend
              )}`}
            >
              {change}
            </div>
          )}

          {subtitle && (
            <div className="text-xs text-slate-500">
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}