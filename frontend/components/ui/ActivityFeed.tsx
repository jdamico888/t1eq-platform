type ActivityFeedItem = {
  id: string;

  title: string;

  description?: string;

  timestamp?: string;

  status?: string;
};

type ActivityFeedProps = {
  title: string;

  items: ActivityFeedItem[];
};

function getStatusColor(
  status?: string
): string {
  if (!status)
    return "bg-cyan-500";

  const normalizedStatus =
    status.toLowerCase();

  if (
    normalizedStatus.includes(
      "completed"
    ) ||
    normalizedStatus.includes(
      "paid"
    ) ||
    normalizedStatus.includes(
      "passed"
    )
  ) {
    return "bg-emerald-500";
  }

  if (
    normalizedStatus.includes(
      "cancel"
    ) ||
    normalizedStatus.includes(
      "failed"
    )
  ) {
    return "bg-red-500";
  }

  if (
    normalizedStatus.includes(
      "pending"
    ) ||
    normalizedStatus.includes(
      "open"
    )
  ) {
    return "bg-amber-500";
  }

  return "bg-cyan-500";
}

export default function ActivityFeed({
  title,
  items,
}: ActivityFeedProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-semibold">
        {title}
      </h2>

      <div className="space-y-5">
        {items.length === 0 && (
          <div className="text-sm text-slate-400">
            No activity found.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4"
          >
            <div
              className={`mt-2 h-3 w-3 shrink-0 rounded-full ${getStatusColor(
                item.status
              )}`}
            />

            <div className="min-w-0 flex-1">
              <div className="font-medium">
                {item.title}
              </div>

              {item.description && (
                <div className="mt-1 text-sm text-slate-400">
                  {item.description}
                </div>
              )}

              {item.timestamp && (
                <div className="mt-2 text-xs text-slate-500">
                  {item.timestamp}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}