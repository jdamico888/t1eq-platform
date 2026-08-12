"use client";

import type { RepairOrderActionItem } from "@/types/repair-orders";

type Props = {
  actionItem: RepairOrderActionItem;
  onUpdate: (actionItem: RepairOrderActionItem) => void;
};

export default function RepairOrderActionItemExecution({
  actionItem,
  onUpdate,
}: Props) {
  function handleStartWork() {
    onUpdate({
      ...actionItem,
      clockInDateTime: new Date().toISOString(),
      status: "In Progress",
    });
  }

  function handleStopWork() {
    onUpdate({
      ...actionItem,
      clockOutDateTime: new Date().toISOString(),
      status: "Completed",
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-xl font-bold text-white">
        Technician Execution
      </h3>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-xs uppercase text-white/50">
            Serial Plate Photo
          </div>

          <div className="mt-2 text-white">
            {actionItem.serialPlatePhotoUrl
              ? "Captured"
              : "Pending"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-xs uppercase text-white/50">
            Assigned Technician
          </div>

          <div className="mt-2 text-white">
            {actionItem.assignedTechnicianName ??
              "Unassigned"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-xs uppercase text-white/50">
            Clock In
          </div>

          <div className="mt-2 text-white">
            {actionItem.clockInDateTime ??
              "Not Started"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-xs uppercase text-white/50">
            Clock Out
          </div>

          <div className="mt-2 text-white">
            {actionItem.clockOutDateTime ??
              "Not Completed"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-xs uppercase text-white/50">
            Before Photos
          </div>

          <div className="mt-2 text-white">
            {actionItem.beforePhotoUrls?.length ?? 0}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <div className="text-xs uppercase text-white/50">
            After Photos
          </div>

          <div className="mt-2 text-white">
            {actionItem.afterPhotoUrls?.length ?? 0}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 md:col-span-2">
          <div className="text-xs uppercase text-white/50">
            Completion Notes
          </div>

          <div className="mt-2 text-white">
            {actionItem.completionNotes ??
              "No completion notes entered"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-4 md:col-span-2">
          <div className="text-xs uppercase text-white/50">
            Customer Signature
          </div>

          <div className="mt-2 text-white">
            {actionItem.customerSignatureUrl
              ? "Captured"
              : "Pending"}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleStartWork}
          className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
        >
          Start Work
        </button>

        <button
          type="button"
          onClick={handleStopWork}
          className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
        >
          Stop Work
        </button>
      </div>
    </div>
  );
}