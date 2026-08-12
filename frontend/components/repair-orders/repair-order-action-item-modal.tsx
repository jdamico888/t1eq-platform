"use client";

import type { RepairOrderActionItem } from "@/types/repair-orders";

import RepairOrderActionItemForm from "./repair-order-action-item-form";

type RepairOrderActionItemModalProps = {
  isOpen: boolean;
  actionItem?: RepairOrderActionItem;
  onSubmit: (actionItem: RepairOrderActionItem) => void;
  onClose: () => void;
};

export default function RepairOrderActionItemModal({
  isOpen,
  actionItem,
  onSubmit,
  onClose,
}: RepairOrderActionItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
              Repair Order Action Item
            </div>

            <h2 className="mt-2 text-3xl font-bold text-white">
              {actionItem ? "Edit Action Item" : "Add Action Item"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/60">
              Add inspection, repair, diagnosis, calibration, parts,
              recommendation, follow-up, or other operational work connected to
              this repair order.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <RepairOrderActionItemForm
          initialActionItem={actionItem}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}