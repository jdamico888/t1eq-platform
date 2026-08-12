import Link from "next/link";

import StatusBadge from "@/components/ui/StatusBadge";

type OpenRepairOrder = {
  id: string;

  repairOrderNumber: string;

  customerName: string;

  equipmentName?: string;

  priority?: string;

  status: string;

  assignedTechnicianName?: string;
};

type OpenRepairOrdersPanelProps = {
  repairOrders: OpenRepairOrder[];
};

export default function OpenRepairOrdersPanel({
  repairOrders,
}: OpenRepairOrdersPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Open Repair Orders
        </h2>

        <div className="text-sm text-slate-400">
          {repairOrders.length} Active
        </div>
      </div>

      <div className="space-y-4">
        {repairOrders.length ===
          0 && (
          <div className="text-sm text-slate-400">
            No open repair orders.
          </div>
        )}

        {repairOrders.map(
          (repairOrder) => (
            <Link
              key={
                repairOrder.id
              }
              href={`/repair-orders/${repairOrder.id}`}
              className="block rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-cyan-500/30 hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-cyan-300">
                    {
                      repairOrder.repairOrderNumber
                    }
                  </div>

                  <div className="mt-1 text-sm">
                    {
                      repairOrder.customerName
                    }
                  </div>

                  {repairOrder.equipmentName && (
                    <div className="mt-1 text-xs text-slate-400">
                      {
                        repairOrder.equipmentName
                      }
                    </div>
                  )}

                  {repairOrder.assignedTechnicianName && (
                    <div className="mt-2 text-xs text-slate-500">
                      Technician:{" "}
                      {
                        repairOrder.assignedTechnicianName
                      }
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {repairOrder.priority && (
                    <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                      {
                        repairOrder.priority
                      }
                    </div>
                  )}

                  <StatusBadge
                    status={
                      repairOrder.status
                    }
                  />
                </div>
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}