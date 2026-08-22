type ActivityItem = {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
};

type RecentActivityCardProps = {
  title: string;
  items: ActivityItem[];
};

export default function RecentActivityCard({
  title,
  items,
}: RecentActivityCardProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-semibold">
        {title}
      </h2>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="text-sm text-slate-400">
            No activity found.
          </div>
        )}

        {items.map((item) => (
          <div data-t1eq-tile="true" data-t1eq-page-card="true"
            key={item.id}
            className="rounded-2xl border border-white/5 bg-black/20 p-4"
          >
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
        ))}
      </div>
    </div>
  );
}