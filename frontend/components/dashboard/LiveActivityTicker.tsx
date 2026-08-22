"use client";

type LiveActivityItem = {
  id: string;

  message: string;

  timestamp?: string;
};

type LiveActivityTickerProps = {
  items: LiveActivityItem[];
};

export default function LiveActivityTicker({
  items,
}: LiveActivityTickerProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-white/5 backdrop-blur-xl">
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-xl font-semibold">
          Live Activity
        </h2>
      </div>

      <div className="space-y-0">
        {items.length === 0 && (
          <div className="px-6 py-5 text-sm text-slate-400">
            No live activity.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border-b border-white/5 px-6 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-400" />

              <div className="text-sm text-slate-200">
                {item.message}
              </div>
            </div>

            {item.timestamp && (
              <div className="text-xs text-slate-500">
                {item.timestamp}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}