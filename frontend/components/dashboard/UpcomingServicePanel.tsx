type UpcomingServiceItem = {
  id: string;

  customerName: string;

  equipmentName: string;

  serviceType?: string;

  dueDate?: string;
};

type UpcomingServicePanelProps = {
  items: UpcomingServiceItem[];
};

export default function UpcomingServicePanel({
  items,
}: UpcomingServicePanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Upcoming Service
        </h2>

        <div className="text-sm text-slate-400">
          {items.length} Scheduled
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="text-sm text-slate-400">
            No upcoming service events.
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
                  {item.equipmentName}
                </div>

                <div className="mt-1 text-sm">
                  {item.customerName}
                </div>

                {item.serviceType && (
                  <div className="mt-1 text-xs text-slate-400">
                    {item.serviceType}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-sm font-medium">
                  {item.dueDate || "-"}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Due Date
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}