type SystemHealthItem = {
  label: string;

  value: string;

  status?: "good" | "warning" | "critical";
};

type SystemHealthPanelProps = {
  items: SystemHealthItem[];
};

function getStatusClasses(
  status?: string
): string {
  switch (status) {
    case "good":
      return "bg-emerald-500";

    case "warning":
      return "bg-amber-500";

    case "critical":
      return "bg-red-500";

    default:
      return "bg-cyan-500";
  }
}

export default function SystemHealthPanel({
  items,
}: SystemHealthPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          System Health
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Operational platform monitoring overview.
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${getStatusClasses(
                  item.status
                )}`}
              />

              <div className="text-sm text-slate-300">
                {item.label}
              </div>
            </div>

            <div className="text-sm font-medium">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}