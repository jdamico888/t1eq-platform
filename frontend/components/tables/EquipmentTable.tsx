"use client";

import Link from "next/link";

import { Equipment } from "@/types/equipment";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type EquipmentTableProps = {
  equipment: Equipment[];

  onEdit?: (equipment: Equipment) => void;

  onDelete?: (equipment: Equipment) => void;
};

export default function EquipmentTable({
  equipment,
  onEdit,
  onDelete,
}: EquipmentTableProps) {
  return (
    <DataTable
      data={equipment}
      emptyMessage="No equipment found."
      columns={[
        {
          key: "equipment",
          header: "Equipment",
          render: (item) => (
            <div>
              <Link
                href={`/equipment/${item.id}`}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {item.manufacturer} {item.model || ""}
              </Link>

              <div className="mt-1 text-xs text-slate-400">
                {item.category}
              </div>
            </div>
          ),
        },

        {
          key: "customerName",
          header: "Customer",
          render: (item) => (
            <div className="text-sm">
              {item.customerName}
            </div>
          ),
        },

        {
          key: "siteName",
          header: "Site",
          render: (item) => (
            <div className="text-sm">
              {item.siteName || "-"}
            </div>
          ),
        },

        {
          key: "serialNumber",
          header: "Serial #",
          render: (item) => (
            <div className="text-sm">
              {item.serialNumber || "-"}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: (item) => (
            <StatusBadge
              status={item.status}
            />
          ),
        },

        {
          key: "actions",
          header: "Actions",
          className: "text-right",
          render: (item) => (
            <div className="flex justify-end gap-2">
              {onEdit && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() =>
                    onEdit(item)
                  }
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() =>
                    onDelete(item)
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