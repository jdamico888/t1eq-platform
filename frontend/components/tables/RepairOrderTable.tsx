"use client";

import Link from "next/link";

import type { RepairOrder } from "@/types/repair-order";

import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

type RepairOrderTableProps = {
  repairOrders: RepairOrder[];
  onEdit?: (repairOrder: RepairOrder) => void;
  onDelete?: (repairOrder: RepairOrder) => void;
};

function getRepairOrderNumber(repairOrder: RepairOrder): string {
  return repairOrder.repairOrderNumber ?? repairOrder.ro ?? repairOrder.id;
}

function getRepairOrderConcern(repairOrder: RepairOrder): string {
  return repairOrder.customerConcern ?? repairOrder.complaint ?? "-";
}

export default function RepairOrderTable({
  repairOrders,
  onEdit,
  onDelete,
}: RepairOrderTableProps) {
  return (
    <DataTable
      data={repairOrders}
      emptyMessage="No repair orders found."
      columns={[
        {
          key: "ro",
          header: "RO #",
          render: (repairOrder) => (
            <div>
              <Link
                href={`/repair-orders/${repairOrder.id}`}
                className="font-black text-cyan-300 transition hover:text-cyan-200"
              >
                {getRepairOrderNumber(repairOrder)}
              </Link>

              <div className="mt-1 text-xs font-bold text-slate-400">
                {repairOrder.priority}
              </div>
            </div>
          ),
        },

        {
          key: "customerName",
          header: "Customer",
          render: (repairOrder) => (
            <div>
              <div className="text-sm font-bold text-white">
                {repairOrder.customerName || "-"}
              </div>

              {repairOrder.siteName && (
                <div className="mt-1 text-xs font-semibold text-slate-400">
                  {repairOrder.siteName}
                </div>
              )}
            </div>
          ),
        },

        {
          key: "equipmentName",
          header: "Equipment",
          render: (repairOrder) => (
            <div className="text-sm font-semibold text-slate-200">
              {repairOrder.equipmentName || "-"}
            </div>
          ),
        },

        {
          key: "customerConcern",
          header: "Concern",
          render: (repairOrder) => (
            <div
              className="max-w-[320px] truncate text-sm font-semibold text-slate-300"
              title={getRepairOrderConcern(repairOrder)}
            >
              {getRepairOrderConcern(repairOrder)}
            </div>
          ),
        },

        {
          key: "assignedTechnicianName",
          header: "Technician",
          render: (repairOrder) => (
            <div className="text-sm font-semibold text-slate-300">
              {repairOrder.assignedTechnicianName || "-"}
            </div>
          ),
        },

        {
          key: "status",
          header: "Status",
          render: (repairOrder) => <StatusBadge status={repairOrder.status} />,
        },

        {
          key: "actions",
          header: "Actions",
          className: "text-right",
          render: (repairOrder) => (
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href={`/repair-orders/${repairOrder.id}`}
                className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Open
              </Link>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(repairOrder)}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-200 transition hover:bg-white/10"
                >
                  Edit
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(repairOrder)}
                  className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-black uppercase tracking-wide text-red-300 transition hover:bg-red-500/10"
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