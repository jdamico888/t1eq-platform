"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type {
  RepairOrderBillingGroup,
  RepairOrderLaborEntry,
  RepairOrderLaborRateSource,
  RepairOrderLaborType,
} from "@/types/repair-order";

const LABOR_TYPES: RepairOrderLaborType[] = [
  "Inspection",
  "Diagnosis",
  "Repair",
  "Calibration",
  "Travel",
  "Mileage",
  "Warranty",
  "Administrative",
  "Other",
];

const RATE_SOURCES: RepairOrderLaborRateSource[] = [
  "Default",
  "Flat Rate",
  "Hourly",
  "Manual",
  "Manual Override",
  "Rate Profile",
  "Warranty",
  "Manufacturer Contract",
  "Customer Contract",
  "Unknown",
];

type Callback = (laborEntry: RepairOrderLaborEntry) => void;

export type RepairOrderLaborEntryFormProps = {
  initialEntry?: Partial<RepairOrderLaborEntry>;
  technicianName?: string;
  manufacturer?: string;
  onSubmit?: Callback;
  onSave?: Callback;
  onAdd?: Callback;
  onCreate?: Callback;
  onLaborEntryCreated?: Callback;
  onCancel?: () => void;
  [key: string]: unknown;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `LABOR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: string, fallback = 0) {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function resolveCallback(props: RepairOrderLaborEntryFormProps): Callback | null {
  return (
    props.onSubmit ??
    props.onSave ??
    props.onAdd ??
    props.onCreate ??
    props.onLaborEntryCreated ??
    null
  );
}

export function RepairOrderLaborEntryForm(
  props: RepairOrderLaborEntryFormProps
) {
  const {
    initialEntry,
    technicianName,
    manufacturer,
    onCancel,
  } = props;

  const [technicianNameValue, setTechnicianNameValue] = useState(
    initialEntry?.technicianName ?? technicianName ?? ""
  );
  const [manufacturerValue, setManufacturerValue] = useState(
    initialEntry?.manufacturer ?? manufacturer ?? ""
  );
  const [laborType, setLaborType] = useState<RepairOrderLaborType>(
    initialEntry?.laborType ?? "Repair"
  );
  const [hours, setHours] = useState(String(initialEntry?.hours ?? 0));
  const [laborRate, setLaborRate] = useState(
    String(initialEntry?.laborRate ?? 0)
  );
  const [mileageRate, setMileageRate] = useState(
    String(initialEntry?.mileageRate ?? "")
  );
  const [rateSource, setRateSource] = useState<RepairOrderLaborRateSource>(
    initialEntry?.rateSource ?? "Default"
  );
  const [billingGroup, setBillingGroup] = useState<RepairOrderBillingGroup>(
    initialEntry?.billingGroup ?? "Repair Charges"
  );
  const [notes, setNotes] = useState(initialEntry?.notes ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();
    const parsedHours = toNumber(hours);
    const parsedLaborRate = toNumber(laborRate);
    const parsedMileageRate =
      mileageRate.trim() === "" ? undefined : toNumber(mileageRate);

    const laborEntry: RepairOrderLaborEntry = {
      id: initialEntry?.id ?? createId(),
      technicianId: initialEntry?.technicianId,
      technicianName: technicianNameValue || undefined,
      actionItemId: initialEntry?.actionItemId,
      actionItemTitle: initialEntry?.actionItemTitle,
      clockInDate: initialEntry?.clockInDate,
      clockOutDate: initialEntry?.clockOutDate,
      manufacturer: manufacturerValue || undefined,
      laborType,
      hours: parsedHours,
      totalMinutes: parsedHours * 60,
      laborRate: parsedLaborRate,
      mileageRate: parsedMileageRate,
      rateSource,
      billingGroup,
      total: parsedHours * parsedLaborRate,
      notes: notes || undefined,
      createdDate: initialEntry?.createdDate ?? now,
      updatedDate: now,
    };

    resolveCallback(props)?.(laborEntry);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Technician
          </span>
          <input
            value={technicianNameValue}
            onChange={(event) => setTechnicianNameValue(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Manufacturer
          </span>
          <input
            value={manufacturerValue}
            onChange={(event) => setManufacturerValue(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Labor Type
          </span>
          <select
            value={laborType}
            onChange={(event) =>
              setLaborType(event.target.value as RepairOrderLaborType)
            }
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          >
            {LABOR_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Rate Source
          </span>
          <select
            value={rateSource}
            onChange={(event) =>
              setRateSource(event.target.value as RepairOrderLaborRateSource)
            }
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          >
            {RATE_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Hours
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Labor Rate
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={laborRate}
            onChange={(event) => setLaborRate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Mileage Rate
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={mileageRate}
            onChange={(event) => setMileageRate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Billing Group
          </span>
          <select
            value={billingGroup}
            onChange={(event) =>
              setBillingGroup(event.target.value as RepairOrderBillingGroup)
            }
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          >
            <option value="Inspection Charges">Inspection Charges</option>
            <option value="Repair Charges">Repair Charges</option>
            <option value="Parts Charges">Parts Charges</option>
            <option value="Other Charges">Other Charges</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
          Notes
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
        />
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-black text-white"
        >
          Save Labor
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-black"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default RepairOrderLaborEntryForm;