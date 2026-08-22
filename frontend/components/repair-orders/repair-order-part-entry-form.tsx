"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import type { RepairOrderPartEntry } from "@/types/repair-order";

type Callback = (partEntry: RepairOrderPartEntry) => void;

export type RepairOrderPartEntryFormProps = {
  initialEntry?: Partial<RepairOrderPartEntry>;
  inventoryItemId?: string;
  partNumber?: string;
  description?: string;
  partImageUrl?: string;
  onSubmit?: Callback;
  onSave?: Callback;
  onAdd?: Callback;
  onCreate?: Callback;
  onPartEntryCreated?: Callback;
  onCancel?: () => void;
  [key: string]: unknown;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `PART-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: string, fallback = 0) {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function resolveCallback(props: RepairOrderPartEntryFormProps): Callback | null {
  return (
    props.onSubmit ??
    props.onSave ??
    props.onAdd ??
    props.onCreate ??
    props.onPartEntryCreated ??
    null
  );
}

export function RepairOrderPartEntryForm(props: RepairOrderPartEntryFormProps) {
  const {
    initialEntry,
    inventoryItemId,
    partNumber,
    description,
    partImageUrl,
    onCancel,
  } = props;

  const [partNumberValue, setPartNumberValue] = useState(
    initialEntry?.partNumber ?? partNumber ?? ""
  );
  const [descriptionValue, setDescriptionValue] = useState(
    initialEntry?.description ?? description ?? ""
  );
  const [partImageUrlValue, setPartImageUrlValue] = useState(
    initialEntry?.partImageUrl ?? partImageUrl ?? ""
  );
  const [quantity, setQuantity] = useState(String(initialEntry?.quantity ?? 1));
  const [cost, setCost] = useState(String(initialEntry?.cost ?? 0));
  const [sellPrice, setSellPrice] = useState(
    String(initialEntry?.sellPrice ?? initialEntry?.unitPrice ?? 0)
  );
  const [notes, setNotes] = useState(initialEntry?.notes ?? "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    const parsedQuantity = toNumber(quantity, 1);
    const parsedCost = toNumber(cost);
    const parsedSellPrice = toNumber(sellPrice);
    const total = parsedQuantity * parsedSellPrice;

    const partEntry: RepairOrderPartEntry = {
      id: initialEntry?.id ?? createId(),
      inventoryItemId: initialEntry?.inventoryItemId ?? inventoryItemId,
      partNumber: partNumberValue,
      description: descriptionValue,
      partImageUrl: partImageUrlValue || undefined,
      quantity: parsedQuantity,
      cost: parsedCost,
      unitCost: parsedCost,
      price: parsedSellPrice,
      sellPrice: parsedSellPrice,
      unitPrice: parsedSellPrice,
      total,
      supplierName: initialEntry?.supplierName,
      sourceStockLocation: initialEntry?.sourceStockLocation,
      sourceTruckId: initialEntry?.sourceTruckId,
      sourceTruckName: initialEntry?.sourceTruckName,
      notes: notes || undefined,
      createdDate: initialEntry?.createdDate ?? now,
      updatedDate: now,
    };

    resolveCallback(props)?.(partEntry);
  }

  return (
    <form data-t1eq-tile="true" data-t1eq-page-card="true" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Part Number
          </span>
          <input data-t1eq-field="true"
            value={partNumberValue}
            onChange={(event) => setPartNumberValue(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Description
          </span>
          <input data-t1eq-field="true"
            value={descriptionValue}
            onChange={(event) => setDescriptionValue(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Quantity
          </span>
          <input data-t1eq-field="true"
            type="number"
            min="0"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Cost
          </span>
          <input data-t1eq-field="true"
            type="number"
            min="0"
            step="0.01"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Sell Price
          </span>
          <input data-t1eq-field="true"
            type="number"
            min="0"
            step="0.01"
            value={sellPrice}
            onChange={(event) => setSellPrice(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
            Part Image URL
          </span>
          <input data-t1eq-field="true"
            value={partImageUrlValue}
            onChange={(event) => setPartImageUrlValue(event.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
          Notes
        </span>
        <textarea data-t1eq-field="true"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black"
        />
      </label>

      <div className="flex gap-3">
        <button data-t1eq-action-button="true"
          type="submit"
          className="rounded-xl bg-black px-4 py-2 text-sm font-black text-white"
        >
          Save Part
        </button>

        {onCancel && (
          <button data-t1eq-action-button="true"
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

export default RepairOrderPartEntryForm;