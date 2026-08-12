"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE,
  REPAIR_ORDER_ACTION_STATUSES,
  REPAIR_ORDER_ACTION_TYPES,
} from "@/constants/repair-orders";

import type {
  RepairOrderActionBillingGroup,
  RepairOrderActionItem,
  RepairOrderActionStatus,
  RepairOrderActionType,
} from "@/types/repair-orders";

type RepairOrderActionItemFormInput = {
  type: RepairOrderActionType;
  billingGroup: RepairOrderActionBillingGroup;
  title: string;
  description: string;
  status: RepairOrderActionStatus;
  
  assignedTechnicianId?: string;
assignedTechnicianName?: string;

clockInDateTime?: string;
clockOutDateTime?: string;
timeClockMethod?: "Photo/QR" | "Manual";

serialPlatePhotoUrl?: string;
beforePhotoUrls?: string[];
afterPhotoUrls?: string[];

customerSignatureUrl?: string;
completionNotes?: string;

laborHours: string;
  laborRate: string;
  partsTotal: string;
  notes: string;
};

type RepairOrderActionItemFormProps = {
  initialActionItem?: RepairOrderActionItem;
  onSubmit: (actionItem: RepairOrderActionItem) => void;
  onCancel?: () => void;
};

const createDefaultFormInput = (): RepairOrderActionItemFormInput => {
  const defaultType: RepairOrderActionType = "Inspection";

  return {
    type: defaultType,
    billingGroup: REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE[defaultType],
    title: "",
    description: "",
    status: "Open",
    laborHours: "",
    laborRate: "",
    partsTotal: "",
    notes: "",
  };
};

const createFormInputFromActionItem = (
  actionItem: RepairOrderActionItem
): RepairOrderActionItemFormInput => {
  return {
    type: actionItem.type,
    billingGroup: actionItem.billingGroup,
    title: actionItem.title,
    description: actionItem.description ?? "",
    status: actionItem.status,
    laborHours:
      actionItem.laborHours === undefined ? "" : String(actionItem.laborHours),
    laborRate:
      actionItem.laborRate === undefined ? "" : String(actionItem.laborRate),
    partsTotal:
      actionItem.partsTotal === undefined ? "" : String(actionItem.partsTotal),
    notes: actionItem.notes ?? "",
  };
};

const parseCurrencyNumber = (value: string) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function RepairOrderActionItemForm({
  initialActionItem,
  onSubmit,
  onCancel,
}: RepairOrderActionItemFormProps) {
  const [formInput, setFormInput] = useState<RepairOrderActionItemFormInput>(
    initialActionItem
      ? createFormInputFromActionItem(initialActionItem)
      : createDefaultFormInput()
  );

  const calculatedTotals = useMemo(() => {
    const laborHours = parseCurrencyNumber(formInput.laborHours);
    const laborRate = parseCurrencyNumber(formInput.laborRate);
    const partsTotal = parseCurrencyNumber(formInput.partsTotal);

    const laborTotal = laborHours * laborRate;
    const total = laborTotal + partsTotal;

    return {
      laborTotal,
      partsTotal,
      total,
    };
  }, [formInput.laborHours, formInput.laborRate, formInput.partsTotal]);

  function handleTypeChange(value: RepairOrderActionType) {
    setFormInput((previous) => ({
      ...previous,
      type: value,
      billingGroup: REPAIR_ORDER_ACTION_BILLING_GROUP_BY_TYPE[value],
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = formInput.title.trim();

    if (!title) {
      alert("Action item title is required.");
      return;
    }

    const now = new Date().toISOString();

    const actionItem: RepairOrderActionItem = {
      id: initialActionItem?.id ?? crypto.randomUUID(),

      type: formInput.type,
      billingGroup: formInput.billingGroup,

      title,
      description: formInput.description.trim() || undefined,

      status: formInput.status,

      laborHours: parseOptionalNumber(formInput.laborHours),
      laborRate: parseOptionalNumber(formInput.laborRate),

      partsTotal: calculatedTotals.partsTotal,
      laborTotal: calculatedTotals.laborTotal,
      total: calculatedTotals.total,

      notes: formInput.notes.trim() || undefined,

      createdDate: initialActionItem?.createdDate ?? now,
      updatedDate: now,
    };

    onSubmit(actionItem);

    if (!initialActionItem) {
      setFormInput(createDefaultFormInput());
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Action Type
          </label>

          <select
            value={formInput.type}
            onChange={(event) =>
              handleTypeChange(event.target.value as RepairOrderActionType)
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          >
            {REPAIR_ORDER_ACTION_TYPES.map((type) => (
              <option key={type} value={type} className="bg-slate-950">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Status
          </label>

          <select
            value={formInput.status}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                status: event.target.value as RepairOrderActionStatus,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          >
            {REPAIR_ORDER_ACTION_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-slate-950">
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Billing Group
        </label>

        <input
          value={formInput.billingGroup}
          readOnly
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70 outline-none"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Title
        </label>

        <input
          value={formInput.title}
          onChange={(event) =>
            setFormInput((previous) => ({
              ...previous,
              title: event.target.value,
            }))
          }
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Example: Inspect lift arm restraints"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Description
        </label>

        <textarea
          value={formInput.description}
          onChange={(event) =>
            setFormInput((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          rows={4}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Describe the inspection, repair, diagnosis, recommendation, or other action item."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Labor Hours
          </label>

          <input
            type="number"
            min="0"
            step="0.1"
            value={formInput.laborHours}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                laborHours: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Labor Rate
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={formInput.laborRate}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                laborRate: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
            Parts Total
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={formInput.partsTotal}
            onChange={(event) =>
              setFormInput((previous) => ({
                ...previous,
                partsTotal: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Labor Total
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {calculatedTotals.laborTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Parts Total
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {calculatedTotals.partsTotal.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">
            Action Total
          </div>

          <div className="mt-1 text-lg font-bold text-white">
            {calculatedTotals.total.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Notes
        </label>

        <textarea
          value={formInput.notes}
          onChange={(event) =>
            setFormInput((previous) => ({
              ...previous,
              notes: event.target.value,
            }))
          }
          rows={3}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400/60"
          placeholder="Internal notes for this action item."
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/30"
        >
          {initialActionItem ? "Update Action Item" : "Add Action Item"}
        </button>
      </div>
    </form>
  );
}