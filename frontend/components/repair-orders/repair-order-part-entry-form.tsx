"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { RepairOrderPartEntry } from "@/types/repair-order";
import type { InventoryItem } from "@/types/inventory-item";

import { getInventoryItems } from "@/services/inventory";
import {
  calculateSuggestedSellPrice,
  getMarkupSettings,
  getSuggestedSellPrice,
  type MarkupSettingsSnapshot,
} from "@/services/pricing";
import { currentUserHasPermission } from "@/services/auth";
import {
  applyManagerSellPriceOverride,
  describePartPriceOverride,
} from "@/services/part-price-override";

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

  /*
   * Cost is an observation a technician records. Sell price is a decision,
   * so it is a manager's field — everyone else sees the system's suggestion
   * read-only. Resolved in an effect: reading permissions during render
   * answers differently on the server than on the client and would trip a
   * hydration mismatch.
   */
  const [canEditCharges, setCanEditCharges] = useState(false);

  const [markupSettings, setMarkupSettings] =
    useState<MarkupSettingsSnapshot>({ generalPercent: 0, tiers: [] });

  /**
   * Whether the sell price on screen is a manager's typed decision rather
   * than the system's suggestion. Only a typed price writes back to
   * inventory, so merely opening and saving a line changes nothing.
   */
  const [sellPriceEditedManually, setSellPriceEditedManually] =
    useState(false);

  /**
   * A linked part whose price a manager already set by hand. Its price must
   * not be recalculated from cost behind their back.
   */
  const [linkedItemPriceOverridden, setLinkedItemPriceOverridden] =
    useState(false);

  const [priceWriteBackMessage, setPriceWriteBackMessage] = useState("");

  /* Inventory is only readable on the client. */
  useEffect(() => {
    setInventoryItems(getInventoryItems());
    setCanEditCharges(currentUserHasPermission("editCharges"));
    setMarkupSettings(getMarkupSettings());
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

    /* Filled by the system from the record, not typed by this person. */
    setSellPriceEditedManually(false);
    setLinkedItemPriceOverridden(Boolean(item.sellPriceOverridden));
    setPriceWriteBackMessage("");

    if (item.imageUrl) {
      setPartImageUrlValue(item.imageUrl);
    }
  }

  /**
   * Cost drives the suggested sell price, so that a technician entering a
   * cost never has to price the part. It stops following once a manager
   * types a price, and never touches a part whose price a manager already
   * set by hand in inventory.
   */
  function handleCostChange(nextCost: string) {
    setCost(nextCost);

    if (sellPriceEditedManually || linkedItemPriceOverridden) {
      return;
    }

    const parsedCost = toNumber(nextCost);

    setSellPrice(
      String(calculateSuggestedSellPrice(parsedCost, markupSettings))
    );
  }

  function handleSellPriceChange(nextSellPrice: string) {
    setSellPrice(nextSellPrice);
    setSellPriceEditedManually(true);
    setPriceWriteBackMessage("");
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

    /*
     * A manager's price decision made during review becomes the part's
     * price in inventory, and holds there until someone edits it in
     * Inventory. Only a typed price counts — the system's own suggestion
     * saving unchanged must not mark the record as manager-set.
     *
     * A part bought for this job that was never stocked has no record to
     * write to; the service reports that rather than failing.
     */
    if (canEditCharges && sellPriceEditedManually && linkedInventoryItemId) {
      const overrideResult = applyManagerSellPriceOverride({
        inventoryItemId: linkedInventoryItemId,
        sellPrice: parsedSellPrice,
        canEditCharges,
      });

      setPriceWriteBackMessage(describePartPriceOverride(overrideResult) ?? "");

      if (overrideResult.status === "applied") {
        setLinkedItemPriceOverridden(true);
        refreshInventory();
      }
    }

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

                /*
                 * The override flag belonged to the part that was linked.
                 * Left set, it would go on blocking cost-driven pricing
                 * for whatever part is keyed next.
                 */
                setLinkedItemPriceOverridden(false);
                setPriceWriteBackMessage("");
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
              onChange={(event) => handleCostChange(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className={fieldLabelClass}>
              Sell Price
              {!canEditCharges && (
                <span className="ml-2 font-bold normal-case tracking-normal text-zinc-400">
                  set by markup
                </span>
              )}
            </span>

            <input data-t1eq-field="true"
              type="number"
              min="0"
              step="0.01"
              value={sellPrice}
              onChange={(event) => handleSellPriceChange(event.target.value)}
              readOnly={!canEditCharges}
              aria-readonly={!canEditCharges}
              title={
                canEditCharges
                  ? undefined
                  : "Sell price is calculated from cost at the markup in Business Setup. A manager can override it during review."
              }
              className={
                canEditCharges
                  ? fieldClass
                  : `${fieldClass} cursor-not-allowed bg-zinc-100 text-zinc-500`
              }
            />

            {canEditCharges && linkedInventoryItemId && (
              <span className="mt-1 block text-xs font-semibold text-zinc-500">
                Changing this updates the part&rsquo;s price in Inventory.
              </span>
            )}
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

        {/*
          A change to a shared record is never silent — the manager who
          made it sees exactly what moved and what it means.
        */}
        {priceWriteBackMessage && (
          <p
            data-t1eq-qbit-type="information-balloon"
            data-t1eq-qbit-id="repair-order-part-price-write-back"
            data-t1eq-qbit-scope="repair-order-part-entry"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
          >
            {priceWriteBackMessage}
          </p>
        )}

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
