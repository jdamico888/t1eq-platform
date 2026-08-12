"use client";

import { DispatchJob } from "@/types/dispatch-job";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type DispatchTableProps = {
  jobs: DispatchJob[];

  onEdit?: (
    job: DispatchJob
  ) => void;

  onDelete?: (
    job: DispatchJob
  ) => void;
};

export default function DispatchTable({
  jobs,
  onEdit,
  onDelete,
}: DispatchTableProps) {
  return (
    <DataTable
      data={jobs}
      emptyMessage="No dispatch jobs found."
      columns={[
        {
          key: "repairOrderNumber",
          header: "RO #",
          render: (job) => (
            <div>
              <div className="font-medium text-cyan-300">
                {job.repairOrderNumber ||
                  "-"}
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {job.customerName}
              </div>
            </div>
          ),
        },

        {
          key: "siteName",
          header: "Site",
          render: (job) => (
            <div className="text-sm">
              {job.siteName ||
                "-"}
            </div>
          ),
        },

        {
          key: "technicianName",
          header: "Technician",
          render: (job) => (
            <div className="text-sm">
              {job.technicianName ||
                "-"}
            </div>
          ),
        },

        {
          key: "scheduledStart",
          header: "Scheduled",
          render: (job) => (
            <div className="text-sm">
              {job.scheduledStart
                ? new Date(
                    job.scheduledStart
                  ).toLocaleString()
                : "-"}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: (job) => (
            <StatusBadge
              status={job.status}
            />
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className:
            "text-right",
          render: (job) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEdit(job)
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() =>
                    onDelete(job)
                  }
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}