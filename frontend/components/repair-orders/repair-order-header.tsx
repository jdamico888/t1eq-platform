import type { RepairOrder, RepairOrderStatus } from "@/types/repair-orders";

import RepairOrderStatusBadge from "./repair-order-status-badge";
import RepairOrderStatusSelector from "./repair-order-status-selector";

type RepairOrderHeaderProps = {
  repairOrder: RepairOrder;
  onStatusChange?: (status: RepairOrderStatus) => void;
};

export default function RepairOrderHeader({
  repairOrder,
  onStatusChange,
}: RepairOrderHeaderProps) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
            Repair Order
          </div>

          <h1 className="mt-2 text-4xl font-bold text-white">
            {repairOrder.repairOrderNumber || repairOrder.ro}
          </h1>

          <div className="mt-3 text-lg text-white/70">
            {repairOrder.customerName}
          </div>

          <div className="mt-1 text-sm text-white/50">
            {repairOrder.equipmentName}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <RepairOrderStatusBadge status={repairOrder.status} />

          <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            {repairOrder.priority} Priority
          </div>
        </div>
      </div>

      {onStatusChange && (
        <div className="mt-6 max-w-sm">
          <RepairOrderStatusSelector
            status={repairOrder.status}
            onStatusChange={onStatusChange}
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Technician
          </div>

          <div className="mt-1 text-sm font-semibold text-white">
            {repairOrder.assignedTechnicianName || "Unassigned"}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Scheduled
          </div>

          <div className="mt-1 text-sm font-semibold text-white">
            {repairOrder.scheduledDate || "Not Scheduled"}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Completed
          </div>

          <div className="mt-1 text-sm font-semibold text-white">
            {repairOrder.completedDate || "Open"}
          </div>
        </div>

        <div data-t1eq-tile="true" data-t1eq-page-card="true" className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Action Items
          </div>

          <div className="mt-1 text-sm font-semibold text-white">
            {repairOrder.actionItems.length}
          </div>
        </div>
      </div>
    </div>
  );
}