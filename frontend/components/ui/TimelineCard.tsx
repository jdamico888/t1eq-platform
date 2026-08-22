type TimelineItem = {
  id: string;

  title: string;

  description?: string;

  timestamp?: string;
};

type TimelineCardProps = {
  title: string;

  items: TimelineItem[];
};

export default function TimelineCard({
  title,
  items,
}: TimelineCardProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-2xl font-semibold">
        {title}
      </h2>

      <div className="space-y-6">
        {items.length === 0 && (
          <div className="text-sm text-slate-400">
            No timeline activity.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="relative pl-6"
          >
            <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-cyan-500" />

            <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/5 bg-black/20 p-4">
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