"use client";

import { useState } from "react";

import EquipmentModelLookup, {
  emptyEquipmentLookupValues,
  resolveEquipmentLookupRecord,
  type EquipmentLookupValues,
} from "./EquipmentModelLookup";

import { REPAIR_ORDER_CUSTOMER_REQUEST_CATEGORIES } from "@/constants/repair-orders";
import { getDefaultRepairOrderBillingGroup } from "@/constants/repair-orders";
import { createId, createTimestamp } from "@/lib/storage";

import type {
  RepairOrderActionItem,
  RepairOrderActionItemType,
} from "@/types/repair-orders";

type ActionItemQuickAddProps = {
  customer: { id?: string; name: string };
  site?: { id?: string; name?: string };
  onAdd: (actionItem: RepairOrderActionItem) => void;
  onCancel?: () => void;
  theme?: "light" | "dark";
  qbitId?: string;
  qbitScope?: string;
};

function parseAmount(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ActionItemQuickAdd({
  customer,
  site,
  onAdd,
  onCancel,
  theme = "light",
  qbitId,
  qbitScope = "global",
}: ActionItemQuickAddProps) {
  const [equipmentValue, setEquipmentValue] = useState<EquipmentLookupValues>(
    emptyEquipmentLookupValues
  );
  const [matchedModelId, setMatchedModelId] = useState<string | null>(null);

  const [category, setCategory] = useState<RepairOrderActionItemType>(
    REPAIR_ORDER_CUSTOMER_REQUEST_CATEGORIES[0]
  );
  const [instructions, setInstructions] = useState("");

  const [partsDescription, setPartsDescription] = useState("");
  const [partsTotal, setPartsTotal] = useState("");

  const [laborDescription, setLaborDescription] = useState("");
  const [laborTotal, setLaborTotal] = useState("");

  const [travelDescription, setTravelDescription] = useState("");
  const [travelTotal, setTravelTotal] = useState("");

  const [miscDescription, setMiscDescription] = useState("");
  const [miscTotal, setMiscTotal] = useState("");

  const labelClass =
    theme === "dark"
      ? "text-xs font-semibold uppercase tracking-wide text-white/50"
      : "mb-1 block text-sm font-medium text-black";

  const inputClass =
    theme === "dark"
      ? "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400/60"
      : "mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-black outline-none transition focus:border-cyan-500";

  const cardClass =
    theme === "dark"
      ? "space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      : "space-y-5 rounded-2xl border border-black/10 bg-white p-5";

  function resetForm() {
    setEquipmentValue(emptyEquipmentLookupValues);
    setMatchedModelId(null);
    setCategory(REPAIR_ORDER_CUSTOMER_REQUEST_CATEGORIES[0]);
    setInstructions("");
    setPartsDescription("");
    setPartsTotal("");
    setLaborDescription("");
    setLaborTotal("");
    setTravelDescription("");
    setTravelTotal("");
    setMiscDescription("");
    setMiscTotal("");
  }

  function handleAddLine() {
    if (!equipmentValue.model.trim()) {
      alert("Equipment model is required for this line.");
      return;
    }

    const resolvedEquipment = resolveEquipmentLookupRecord(
      equipmentValue,
      matchedModelId,
      customer,
      site
    );

    const parsedPartsTotal = parseAmount(partsTotal);
    const parsedLaborTotal = parseAmount(laborTotal);
    const parsedTravelTotal = parseAmount(travelTotal);
    const parsedMiscTotal = parseAmount(miscTotal);

    const total =
      (parsedPartsTotal ?? 0) +
      (parsedLaborTotal ?? 0) +
      (parsedTravelTotal ?? 0) +
      (parsedMiscTotal ?? 0);

    const now = createTimestamp();

    const actionItem: RepairOrderActionItem = {
      id: createId(),

      type: category,
      status: "Open",

      title: `${category} — ${equipmentValue.model.trim()}`,
      description: instructions.trim() || undefined,

      billingGroup: getDefaultRepairOrderBillingGroup(category),

      equipmentId: resolvedEquipment.id,
      equipmentSnapshot: {
        equipmentId: resolvedEquipment.id,
        equipmentModelId: matchedModelId ?? undefined,
        equipmentName: equipmentValue.model.trim(),
        equipmentDescription: equipmentValue.serialNumber.trim() || undefined,
        manufacturer: resolvedEquipment.manufacturer || undefined,
        model: equipmentValue.model.trim(),
        serialNumber: equipmentValue.serialNumber.trim() || undefined,
      },

      generatedPartsDescription: partsDescription.trim() || undefined,
      generatedPartsTotal: parsedPartsTotal,

      generatedLaborDescription: laborDescription.trim() || undefined,
      generatedLaborTotal: parsedLaborTotal,

      generatedTravelDescription: travelDescription.trim() || undefined,
      generatedTravelTotal: parsedTravelTotal,

      generatedMiscDescription: miscDescription.trim() || undefined,
      generatedMiscTotal: parsedMiscTotal,

      laborTotal: parsedLaborTotal ?? 0,
      partsTotal: parsedPartsTotal ?? 0,
      total,

      createdDate: now,
      updatedDate: now,
    };

    onAdd(actionItem);
    resetForm();
  }

  return (
    <div
      data-t1eq-qbit-type={qbitId ? "section" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className={cardClass}
    >
      <EquipmentModelLookup
        qbitId={qbitId ? `${qbitId}-equipment` : undefined}
        qbitScope={qbitScope}
        theme={theme}
        value={equipmentValue}
        onChange={setEquipmentValue}
        matchedModelId={matchedModelId}
        onMatchedModelIdChange={setMatchedModelId}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Customer Request</span>

          <select data-t1eq-field="true"
            data-t1eq-qbit-type="field"
            data-t1eq-qbit-id={qbitId ? `${qbitId}-category` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as RepairOrderActionItemType)
            }
            className={inputClass}
          >
            {REPAIR_ORDER_CUSTOMER_REQUEST_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Initial Instructions</span>

        <textarea data-t1eq-field="true"
          data-t1eq-qbit-type="field"
          data-t1eq-qbit-id={qbitId ? `${qbitId}-instructions` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          rows={3}
          placeholder="Describe what the customer is asking for."
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldPair
          label="Parts"
          descriptionValue={partsDescription}
          onDescriptionChange={setPartsDescription}
          totalValue={partsTotal}
          onTotalChange={setPartsTotal}
          labelClass={labelClass}
          inputClass={inputClass}
          qbitId={qbitId ? `${qbitId}-parts` : undefined}
          qbitScope={qbitScope}
        />

        <FieldPair
          label="Labor"
          descriptionValue={laborDescription}
          onDescriptionChange={setLaborDescription}
          totalValue={laborTotal}
          onTotalChange={setLaborTotal}
          labelClass={labelClass}
          inputClass={inputClass}
          qbitId={qbitId ? `${qbitId}-labor` : undefined}
          qbitScope={qbitScope}
        />

        <FieldPair
          label="Travel"
          descriptionValue={travelDescription}
          onDescriptionChange={setTravelDescription}
          totalValue={travelTotal}
          onTotalChange={setTravelTotal}
          labelClass={labelClass}
          inputClass={inputClass}
          qbitId={qbitId ? `${qbitId}-travel` : undefined}
          qbitScope={qbitScope}
        />

        <FieldPair
          label="Misc"
          descriptionValue={miscDescription}
          onDescriptionChange={setMiscDescription}
          totalValue={miscTotal}
          onTotalChange={setMiscTotal}
          labelClass={labelClass}
          inputClass={inputClass}
          qbitId={qbitId ? `${qbitId}-misc` : undefined}
          qbitScope={qbitScope}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button data-t1eq-action-button="true"
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id={qbitId ? `${qbitId}-cancel` : undefined}
            data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
            type="button"
            onClick={onCancel}
            className={
              theme === "dark"
                ? "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                : "rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-100"
            }
          >
            Cancel
          </button>
        )}

        <button data-t1eq-action-button="true"
          data-t1eq-qbit-type="action-button"
          data-t1eq-qbit-id={qbitId ? `${qbitId}-submit` : undefined}
          data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
          type="button"
          onClick={handleAddLine}
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
        >
          Add Line
        </button>
      </div>
    </div>
  );
}

function FieldPair({
  label,
  descriptionValue,
  onDescriptionChange,
  totalValue,
  onTotalChange,
  labelClass,
  inputClass,
  qbitId,
  qbitScope,
}: {
  label: string;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  totalValue: string;
  onTotalChange: (value: string) => void;
  labelClass: string;
  inputClass: string;
  qbitId?: string;
  qbitScope?: string;
}) {
  return (
    <div data-t1eq-tile="true" data-t1eq-page-card="true"
      data-t1eq-qbit-type={qbitId ? "tile" : undefined}
      data-t1eq-qbit-id={qbitId ? `${qbitId}-wrapper` : undefined}
      data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
      className="space-y-2 rounded-xl border border-black/5 p-3"
    >
      <div className={labelClass}>{label}</div>

      <input data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId ? `${qbitId}-description` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        value={descriptionValue}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder={`${label} description`}
        className={inputClass}
      />

      <input data-t1eq-field="true"
        data-t1eq-qbit-type="field"
        data-t1eq-qbit-id={qbitId ? `${qbitId}-total` : undefined}
        data-t1eq-qbit-scope={qbitId ? qbitScope : undefined}
        type="number"
        min="0"
        step="0.01"
        value={totalValue}
        onChange={(event) => onTotalChange(event.target.value)}
        placeholder={`${label} amount`}
        className={inputClass}
      />
    </div>
  );
}
