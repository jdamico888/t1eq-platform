import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";

type ServiceScheduleItem = {
  id: string;

  repairOrderNumber?: string;

  customerName: string;

  technicianName?: string;

  scheduledDate?: string;

  status: string;
};

type ServiceSchedulePanelProps = {
  schedules: ServiceScheduleItem[];
};

export default function ServiceSchedulePanel({
  schedules,
}: ServiceSchedulePanelProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Service Schedule
        </h2>

        <div className="text-sm text-slate-400">
          {schedules.length} Scheduled
        </div>
      </div>

      <div className="space-y-4">
        {schedules.length === 0 && (
          <div className="text-sm text-slate-400">
            No scheduled service jobs.
          </div>
        )}

        {schedules.map((schedule) => (
          <Link
            key={schedule.id}
            href={`/dispatch/${schedule.id}`}
            className="block rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-cyan-500/30 hover:bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {schedule.repairOrderNumber && (
                  <div className="font-medium text-cyan-300">
                    {
                      schedule.repairOrderNumber
                    }
                  </div>
                )}

                <div className="mt-1 text-sm">
                  {schedule.customerName}
                </div>

                {schedule.technicianName && (
                  <div className="mt-1 text-xs text-slate-400">
                    Technician:{" "}
                    {
                      schedule.technicianName
                    }
                  </div>
                )}

                {schedule.scheduledDate && (
                  <div className="mt-2 text-xs text-slate-500">
                    {new Date(
                      schedule.scheduledDate
                    ).toLocaleString()}
                  </div>
                )}
              </div>

              <StatusBadge
                status={schedule.status}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}