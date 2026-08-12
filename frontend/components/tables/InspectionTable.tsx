"use client";

import Link from "next/link";

import { Inspection } from "@/types/inspection";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type InspectionTableProps = {
  inspections: Inspection[];

  onEdit?: (inspection: Inspection) => void;

  onDelete?: (inspection: Inspection) => void;
};

export default function InspectionTable({
  inspections,
  onEdit,
  onDelete,
}: InspectionTableProps) {
  return (
    <DataTable
      data={inspections}
      emptyMessage="No inspections found."
      columns={[
        {
          key: "inspectionNumber",
          header: "Inspection #",
          render: (inspection) => (
            <div>
              <Link
                href={`/inspections/${inspection.id}`}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {inspection.inspectionNumber}
              </Link>

              <div className="mt-1 text-xs text-slate-400">
                {inspection.inspectionDate}
              </div>
            </div>
          ),
        },
        {
          key: "customerName",
          header: "Customer",
          render: (inspection) => (
            <div>
              <div className="text-sm">{inspection.customerName}</div>

              {inspection.siteName && (
                <div className="mt-1 text-xs text-slate-400">
                  {inspection.siteName}
                </div>
              )}
            </div>
          ),
        },
        {
          key: "equipmentName",
          header: "Equipment",
          render: (inspection) => (
            <div className="text-sm">{inspection.equipmentName}</div>
          ),
        },
        {
          key: "inspectorName",
          header: "Inspector",
          render: (inspection) => (
            <div className="text-sm">{inspection.inspectorName || "-"}</div>
          ),
        },
        {
          key: "status",
          header: "Status",
          render: (inspection) => <StatusBadge status={inspection.status} />,
        },
        {
          key: "actions",
          header: "Actions",
          className: "text-right",
          render: (inspection) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(inspection)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(inspection)}
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