"use client";

import type { ChangeEvent } from "react";

import {
  canTransitionRepairOrderStatus,
  getAvailableRepairOrderStatusTransitions,
} from "@/services/repair-order-status-workflow";

import type { RepairOrderStatus } from "@/types/repair-orders";

type RepairOrderStatusSelectorProps = {
  status: RepairOrderStatus;
  onStatusChange: (status: RepairOrderStatus) => void;
};

export default function RepairOrderStatusSelector({
  status,
  onStatusChange,
}: RepairOrderStatusSelectorProps) {
  const availableStatuses = [
    status,
    ...getAvailableRepairOrderStatusTransitions(status),
  ];

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextStatus = event.target.value as RepairOrderStatus;

    if (!canTransitionRepairOrderStatus(status, nextStatus)) {
      alert(`Cannot change repair order status from ${status} to ${nextStatus}.`);
      return;
    }

    onStatusChange(nextStatus);
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
        Workflow Status
      </label>

      <select
        value={status}
        onChange={handleChange}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-blue-400/60"
      >
        {availableStatuses.map((availableStatus) => (
          <option
            key={availableStatus}
            value={availableStatus}
            className="bg-slate-950"
          >
            {availableStatus}
          </option>
        ))}
      </select>
    </div>
  );
}