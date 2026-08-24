"use client";

import { useState } from "react";

import type { InventoryItem } from "@/types/inventory-item";

import type { AddItemMode } from "./AddItemModal";
import AddItemModal from "./AddItemModal";

const QBIT_SCOPE = "add-item-button";

/**
 * The button half of the Add Item flow, kept separate so a page that is a
 * server component (the Inventory hub, for one) can drop in the button
 * without becoming a client component itself.
 */
type AddItemButtonProps = {
  label?: string;

  mode?: AddItemMode;

  initialPartNumber?: string;
  initialDescription?: string;
  initialCost?: number;
  initialLocationId?: string;

  /**
   * "light" suits the white/zinc screens (Inventory hub, Truck Stock);
   * "dark" suits the slate screens (Settings, Receiving).
   */
  variant?: "light" | "dark";

  /**
   * Only usable from a client component parent — a server component cannot
   * pass a function across the boundary.
   */
  onAdded?: (item: InventoryItem) => void;

  qbitId?: string;
};

const VARIANT_CLASSES: Record<"light" | "dark", string> = {
  light:
    "rounded-xl border border-black/20 bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-black/80",
  dark:
    "rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-orange-950/30 transition hover:bg-orange-400",
};

export default function AddItemButton({
  label = "Add Item",
  mode = "inventory",
  initialPartNumber,
  initialDescription,
  initialCost,
  initialLocationId,
  variant = "light",
  onAdded,
  qbitId = "add-item-button",
}: AddItemButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleAdded(item: InventoryItem) {
    onAdded?.(item);
  }

  return (
    <>
      <button data-t1eq-action-button="true"
        data-t1eq-qbit-type="action-button"
        data-t1eq-qbit-id={qbitId}
        data-t1eq-qbit-scope={QBIT_SCOPE}
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={VARIANT_CLASSES[variant]}
      >
        {label}
      </button>

      <AddItemModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdded={handleAdded}
        mode={mode}
        initialPartNumber={initialPartNumber}
        initialDescription={initialDescription}
        initialCost={initialCost}
        initialLocationId={initialLocationId}
      />
    </>
  );
}
