"use client";

import { Technician } from "@/types/technician";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type TechnicianTableProps = {
  technicians: Technician[];

  onEdit?: (
    technician: Technician
  ) => void;

  onDelete?: (
    technician: Technician
  ) => void;
};

function getFullName(
  technician: Technician
): string {
  return `${technician.firstName} ${technician.lastName}`;
}

export default function TechnicianTable({
  technicians,
  onEdit,
  onDelete,
}: TechnicianTableProps) {
  return (
    <DataTable
      data={technicians}
      emptyMessage="No technicians found."
      columns={[
        {
          key: "employeeId",
          header: "Employee ID",
          render: (
            technician
          ) => (
            <div>
              <div className="font-medium text-cyan-300">
                {
                  technician.employeeId
                }
              </div>

              <div className="mt-1 text-xs text-slate-400">
                {technician.certifications
                  ?.length || 0}{" "}
                Certifications
              </div>
            </div>
          ),
        },

        {
          key: "name",
          header: "Technician",
          render: (
            technician
          ) => (
            <div>
              <div className="font-medium">
                {getFullName(
                  technician
                )}
              </div>

              {technician.email && (
                <div className="mt-1 text-xs text-slate-400">
                  {
                    technician.email
                  }
                </div>
              )}
            </div>
          ),
        },

        {
          key: "phone",
          header: "Phone",
          render: (
            technician
          ) => (
            <div className="text-sm">
              {technician.phone ||
                "-"}
            </div>
          ),
        },

        {
          key: "laborRate",
          header: "Labor Rate",
          render: (
            technician
          ) => (
            <div className="text-sm">
              {typeof technician.laborRate ===
              "number"
                ? `$${technician.laborRate.toFixed(
                    2
                  )}`
                : "-"}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: (
            technician
          ) => (
            <StatusBadge
              status={
                technician.status
              }
            />
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className:
            "text-right",
          render: (
            technician
          ) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() =>
                    onEdit(
                      technician
                    )
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
                    onDelete(
                      technician
                    )
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