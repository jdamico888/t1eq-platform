type LowInventoryItem = {
  id: string;
  partNumber: string;
  name: string;
  quantityOnHand: number;
  minimumQuantity?: number;
  location?: string;
};

type LowInventoryPanelProps = {
  items: LowInventoryItem[];
};

export default function LowInventoryPanel({
  items,
}: LowInventoryPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Low Inventory</h2>

        <div className="text-sm text-slate-400">
          {items.length} Items
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="text-sm text-slate-400">
            No low inventory alerts.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/5 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-cyan-300">
                  {item.partNumber}
                </div>

                <div className="mt-1 text-sm">{item.name}</div>

                {item.location && (
                  <div className="mt-1 text-xs text-slate-400">
                    Location: {item.location}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-amber-300">
                  {item.quantityOnHand}
                </div>

                <div className="text-xs text-slate-500">
                  Min: {item.minimumQuantity ?? 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}