"use client";

import { useEffect, useMemo, useState } from "react";

import type { InventoryItem } from "@/types/inventory-item";
import type { RepairOrderPartEntry } from "@/types/repair-order";

import { getInventoryItems } from "@/services/inventory";
import { getSuggestedSellPrice } from "@/services/pricing";
import { createId, createTimestamp } from "@/lib/storage";
import { resolveInitialSpecialOrderStatus } from "@/services/special-order-parts";

import Typeahead, { type TypeaheadOption } from "./Typeahead";
import AddItemModal from "@/components/inventory/AddItemModal";

const QBIT_SCOPE = "action-item-part-picker";

type ActionItemPartPickerProps = {
  partEntries: RepairOrderPartEntry[];
  onChange: (partEntries: RepairOrderPartEntry[]) => void;

  theme?: "light" | "dark";

  /**
   * Job context for the on-the-fly flow. An appointment being booked has no
   * id yet, so this is often partial — the purchase is still recorded, just
   * without an event to hang it on.
   */
  usageContext?: {
    repairOrderId?: string;
    repairOrderNumber?: string;
    scheduleEventId?: string;
    technicianId?: string;
    technicianName?: string;
  };

  qbitId?: string;
};

const THEME = {
  light: {
    heading: "text-sm font-bold text-black",
    hint: "text-xs font-semibold text-black/50",
    row: "flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3",
    rowTitle: "text-sm font-semibold text-black",
    rowMeta: "text-xs text-black/50",
    empty:
      "rounded-xl border border-dashed border-black/10 bg-zinc-50 p-4 text-center text-xs font-semibold text-black/50",
    addButton:
      "rounded-xl border border-black/20 bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black/80",
    remove:
      "rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100",
  },
  dark: {
    heading: "text-sm font-bold text-white",
    hint: "text-xs font-semibold text-white/50",
    row: "flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3",
    rowTitle: "text-sm font-semibold text-white",
    rowMeta: "text-xs text-white/50",
    empty:
      "rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-center text-xs font-semibold text-white/50",
    addButton:
      "rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/30",
    remove:
      "rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20",
  },
} as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export default function ActionItemPartPicker({
  partEntries,
  onChange,
  theme = "light",
  usageContext,
  qbitId = "action-item-part-picker",
}: ActionItemPartPickerProps) {
  const styles = THEME[theme];

  const [searchValue, setSearchValue] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  /* Inventory only exists on the client. */
  useEffect(() => {
    setInventoryItems(getInventoryItems());
  }, []);

  /**
   * Part number leads, then the description, then the stock count — so it
   * is obvious whether the shop already has one before anyone goes to buy
   * it.
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

  function addPartFromInventory(item: InventoryItem) {
    const unitPrice =
      item.sellPrice || item.price || getSuggestedSellPrice(item.cost ?? 0);

    const timestamp = createTimestamp();

    const isSpecialOrder = Boolean(item.isSpecialOrder);

    const entry: RepairOrderPartEntry = {
      id: createId(),
      inventoryItemId: item.id,
      partNumber: item.partNumber,
      description: item.name || item.description || "",
      quantity: 1,
      unitCost: item.cost ?? 0,
      cost: item.cost ?? 0,
      unitPrice,
      price: unitPrice,
      sellPrice: unitPrice,
      total: unitPrice,
      partImageUrl: item.imageUrl,

      /*
       * A part flagged special-order in inventory arrives that way. A
       * normally-stocked part can still be flipped per line below, for a
       * one-off order.
       */
      isSpecialOrder,
      specialOrderStatus: isSpecialOrder
        ? resolveInitialSpecialOrderStatus()
        : undefined,

      createdDate: timestamp,
      updatedDate: timestamp,
    };

    onChange([...partEntries, entry]);
    setSearchValue("");
  }

  /**
   * The flag rides with the entry rather than going through the service,
   * because an appointment being booked has no id yet — there is nothing
   * to save against until the appointment itself is stored.
   */
  function toggleSpecialOrder(entryId: string, isSpecialOrder: boolean) {
    onChange(
      partEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              isSpecialOrder,
              specialOrderStatus: isSpecialOrder
                ? (entry.specialOrderStatus ??
                  resolveInitialSpecialOrderStatus())
                : undefined,
              updatedDate: createTimestamp(),
            }
          : entry
      )
    );
  }

  function updateQuantity(entryId: string, nextQuantity: number) {
    onChange(
      partEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              quantity: nextQuantity,
              total:
                Math.round(nextQuantity * entry.sellPrice * 100) / 100,
              updatedDate: createTimestamp(),
            }
          : entry
      )
    );
  }

  function removeEntry(entryId: string) {
    onChange(partEntries.filter((entry) => entry.id !== entryId));
  }

  return (
    <div
      data-t1eq-qbit-type="section"
      data-t1eq-qbit-id={qbitId}
      data-t1eq-qbit-scope={QBIT_SCOPE}
      className="space-y-3"
    >
      <div>
        <div className={styles.heading}>Parts On This Line</div>

        <div className={styles.hint}>
          Search stock, or add a part bought for this job.
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <Typeahead<InventoryItem>
            qbitId={`${qbitId}-search`}
            qbitScope={QBIT_SCOPE}
            theme={theme}
            placeholder="Search part number or description..."
            value={searchValue}
            onChange={setSearchValue}
            onSelect={(option) => {
              if (option.data) {
                addPartFromInventory(option.data);
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
          data-t1eq-qbit-id={`${qbitId}-add-item`}
          data-t1eq-qbit-scope={QBIT_SCOPE}
          className={styles.addButton}
        >
          + Add Item
        </button>
      </div>

      {partEntries.length === 0 ? (
        <div className={styles.empty}>
          No parts on this line yet.
        </div>
      ) : (
        <div className="space-y-2">
          {partEntries.map((entry) => (
            <div
              key={entry.id}
              data-t1eq-qbit-type="tile"
              data-t1eq-qbit-id={`${qbitId}-entry-${entry.id}`}
              data-t1eq-qbit-scope={QBIT_SCOPE}
              className={styles.row}
            >
              <div className="min-w-0">
                <div className={styles.rowTitle}>
                  {entry.partNumber}
                </div>

                <div className={styles.rowMeta}>
                  {entry.description} · {formatCurrency(entry.sellPrice)} each
                  {entry.inventoryItemId ? "" : " · bought for this job"}
                </div>

                {/*
                  Special order means the shop does not stock it and has to
                  buy it in, so the customer pays before it is ordered.
                */}
                <label className="mt-1 flex items-center gap-2">
                  <input data-t1eq-field="true"
                    data-t1eq-qbit-type="field"
                    data-t1eq-qbit-id={`${qbitId}-entry-${entry.id}-special-order`}
                    data-t1eq-qbit-scope={QBIT_SCOPE}
                    type="checkbox"
                    checked={Boolean(entry.isSpecialOrder)}
                    onChange={(event) =>
                      toggleSpecialOrder(entry.id, event.target.checked)
                    }
                    className="h-4 w-4 shrink-0"
                  />

                  <span className={styles.rowMeta}>
                    Special order — customer pays before we order it
                  </span>
                </label>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <input data-t1eq-field="true"
                  data-t1eq-qbit-type="field"
                  data-t1eq-qbit-id={`${qbitId}-entry-${entry.id}-quantity`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  type="number"
                  min="1"
                  step="1"
                  value={entry.quantity}
                  onChange={(event) =>
                    updateQuantity(entry.id, Number(event.target.value) || 1)
                  }
                  className={
                    theme === "dark"
                      ? "w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm font-bold text-white outline-none"
                      : "w-16 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm font-bold text-black outline-none"
                  }
                />

                <div className={styles.rowTitle}>
                  {formatCurrency(entry.total)}
                </div>

                <button data-t1eq-action-button="true"
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  data-t1eq-qbit-type="action-button"
                  data-t1eq-qbit-id={`${qbitId}-entry-${entry.id}-remove`}
                  data-t1eq-qbit-scope={QBIT_SCOPE}
                  className={styles.remove}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddItemModal
        open={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        mode="onTheFly"
        initialPartNumber={searchValue}
        usageContext={usageContext}
        onAdded={(item) => {
          addPartFromInventory(item);
          setInventoryItems(getInventoryItems());
        }}
      />
    </div>
  );
}
