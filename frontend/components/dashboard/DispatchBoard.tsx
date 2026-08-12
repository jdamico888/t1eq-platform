import StatusBadge from "@/components/ui/StatusBadge";

type DispatchBoardJob = {
  id: string;

  repairOrderNumber?: string;

  customerName: string;

  technicianName?: string;

  status: string;

  scheduledStart?: string;
};

type DispatchBoardProps = {
  jobs: DispatchBoardJob[];
};

export default function DispatchBoard({
  jobs,
}: DispatchBoardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Dispatch Board
        </h2>

        <div className="text-sm text-slate-400">
          {jobs.length} Active Jobs
        </div>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 && (
          <div className="text-sm text-slate-400">
            No active dispatch jobs.
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-white/5 bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium text-cyan-300">
                  {job.repairOrderNumber ||
                    "No RO"}
                </div>

                <div className="mt-1 text-sm">
                  {job.customerName}
                </div>

                {job.technicianName && (
                  <div className="mt-1 text-xs text-slate-400">
                    Technician:{" "}
                    {
                      job.technicianName
                    }
                  </div>
                )}

                {job.scheduledStart && (
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(
                      job.scheduledStart
                    ).toLocaleString()}
                  </div>
                )}
              </div>

              <StatusBadge
                status={job.status}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}