"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { RepairOrderPartEntry } from "@/types/repair-order";
import type { InventoryItem } from "@/types/inventory-item";

import { getInventoryItems } from "@/services/inventory";
import { getSuggestedSellPrice } from "@/services/pricing";

import Typeahead, {
  type TypeaheadOption,
} from "@/components/forms/Typeahead";
import AddItemModal from "@/components/inventory/AddItemModal";

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

  /**
   * Job context, passed through to the on-the-fly Add Item flow so a part
   * bought mid-job is attributed to the job in sales history. Optional —
   * the search and form work without it, the purchase just is not tied to
   * a repair order.
   */
  repairOrderId?: string;
  repairOrderNumber?: string;
  actionItemId?: string;
  technicianId?: string;
  technicianName?: string;

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

const fieldLabelClass =
  "text-xs font-black uppercase tracking-wide text-zinc-500";

const fieldClass =
  "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold outline-none focus:border-black";

export function RepairOrderPartEntryForm(props: RepairOrderPartEntryFormProps) {
  const {
    initialEntry,
    inventoryItemId,
    partNumber,
    description,
    partImageUrl,
    onCancel,
    repairOrderId,
    repairOrderNumber,
    actionItemId,
    technicianId,
    technicianName,
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

  const [linkedInventoryItemId, setLinkedInventoryItemId] = useState(
    initialEntry?.inventoryItemId ?? inventoryItemId
  );

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  /* Inventory is only readable on the client. */
  useEffect(() => {
    setInventoryItems(getInventoryItems());
  }, []);

  function refreshInventory() {
    setInventoryItems(getInventoryItems());
  }

  /**
   * Part number first, description second, and the stock count on the end —
   * so a technician can see at a glance whether the shop already has one
   * before deciding to go buy it.
   */
  const partOptions = useMemo<TypeaheadOption<InventoryItem>[]>(
    () =>
      inventoryItems.map((item) => ({
        id: item.id,
        label: item.partNumber,
        sublabel: [
          item.name,
          item.quantityOnHand > 0
            ? `${item.quantityOnHand} in stock`
            : "Out of stock",
          item.location,
        ]
          .filter(Boolean)
          .join(" · "),
        data: item,
      })),
    [inventoryItems]
  );

  function applyInventoryItem(item: InventoryItem) {
    setPartNumberValue(item.partNumber);
    setDescriptionValue(item.name || item.description || "");
    setLinkedInventoryItemId(item.id);
    setCost(String(item.cost ?? 0));
    setSellPrice(
      String(item.sellPrice || item.price || getSuggestedSellPrice(item.cost ?? 0))
    );

    if (item.imageUrl) {
      setPartImageUrlValue(item.imageUrl);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    const parsedQuantity = toNumber(quantity, 1);
    const parsedCost = toNumber(cost);
    const parsedSellPrice = toNumber(sellPrice);
    const total = parsedQuantity * parsedSellPrice;

    const partEntry: RepairOrderPartEntry = {
      id: initialEntry?.id ?? createId(),
      inventoryItemId: linkedInventoryItemId,
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
    <>
      <form data-t1eq-tile="true" data-t1eq-page-card="true" onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Typeahead<InventoryItem>
              qbitId="repair-order-part-search"
              qbitScope="repair-order-part-entry"
              theme="light"
              label="Find A Part"
              placeholder="Search part number or description..."
              value={partNumberValue}
              onChange={(value) => {
                setPartNumberValue(value);
                // Typing over a chosen part breaks the inventory link.
                setLinkedInventoryItemId(undefined);
              }}
              onSelect={(option) => {
                if (option.data) {
                  applyInventoryItem(option.data);
                }
              }}
              options={partOptions}
              noMatchHint="Not in stock — use Add Item to record a part you bought."
            />
          </div>

          <button data-t1eq-action-button="true"
            type="button"
            onClick={() => setIsAddItemOpen(true)}
            data-t1eq-qbit-type="action-button"
            data-t1eq-qbit-id="repair-order-part-add-item"
            data-t1eq-qbit-scope="repair-order-part-entry"
            className="rounded-xl border border-black/20 bg-black px-4 py-2.5 text-sm font-black text-white transition hover:bg-black/80"
          >
            + Add Item
          </button>
        </div>

        {linkedInventoryItemId && (
          <p className="text-xs font-bold text-emerald-700">
            Linked to inventory — this will draw from stock.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={fieldLabelClass}>Part Number</span>
            <input data-t1eq-field="true"
              value={partNumberValue}
              onChange={(event) => setPartNumberValue(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Description</span>
            <input data-t1eq-field="true"
              value={descriptionValue}
              onChange={(event) => setDescriptionValue(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Quantity</span>
            <input data-t1eq-field="true"
              type="number"
              min="0"
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Cost</span>
            <input data-t1eq-field="true"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(event) => setCost(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Sell Price</span>
            <input data-t1eq-field="true"
              type="number"
              min="0"
              step="0.01"
              value={sellPrice}
              onChange={(event) => setSellPrice(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>Part Image URL</span>
            <input data-t1eq-field="true"
              value={partImageUrlValue}
              onChange={(event) => setPartImageUrlValue(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <label className="block">
          <span className={fieldLabelClass}>Notes</span>
          <textarea data-t1eq-field="true"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className={fieldClass}
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

      {/*
        On-the-fly purchase. Whatever gets added flows straight back into
        this form, so the technician does not key the part twice.
      */}
      <AddItemModal
        open={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        mode="onTheFly"
        initialPartNumber={partNumberValue}
        usageContext={{
          repairOrderId,
          repairOrderNumber,
          actionItemId,
          technicianId,
          technicianName,
        }}
        onAdded={(item) => {
          applyInventoryItem(item);
          refreshInventory();
        }}
      />
    </>
  );
}

export default RepairOrderPartEntryForm;
