import Link from "next/link";

type RecentEquipmentItem = {
  id: string;

  manufacturer: string;

  model?: string;

  category?: string;

  customerName?: string;

  serialNumber?: string;
};

type RecentEquipmentPanelProps = {
  equipment: RecentEquipmentItem[];
};

export default function RecentEquipmentPanel({
  equipment,
}: RecentEquipmentPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Recent Equipment
        </h2>

        <div className="text-sm text-slate-400">
          {equipment.length} Assets
        </div>
      </div>

      <div className="space-y-4">
        {equipment.length === 0 && (
          <div className="text-sm text-slate-400">
            No equipment records found.
          </div>
        )}

        {equipment.map((item) => (
          <Link
            key={item.id}
            href={`/equipment/${item.id}`}
            className="block rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-cyan-500/30 hover:bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-cyan-300">
                  {item.manufacturer}{" "}
                  {item.model || ""}
                </div>

                {item.category && (
                  <div className="mt-1 text-sm text-slate-400">
                    {item.category}
                  </div>
                )}

                {item.customerName && (
                  <div className="mt-1 text-xs text-slate-500">
                    {item.customerName}
                  </div>
                )}
              </div>

              {item.serialNumber && (
                <div className="text-right text-xs text-slate-500">
                  SN:{" "}
                  {item.serialNumber}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}