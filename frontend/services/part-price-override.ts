import type { InventoryItem } from "@/types/inventory-item";

import { getInventoryItemById, updateInventoryItem } from "@/services/inventory";

/**
 * A manager's sell-price decision made while reviewing a job, written back
 * to the part's inventory record.
 *
 * The rule this implements: a technician records cost and photos, the
 * system suggests the sell price from the markup in Business Setup, and a
 * manager may override that during review. The manager's override becomes
 * the part's price in inventory — and stays that way until someone edits
 * the price in inventory again.
 *
 * `sellPriceOverridden` is what makes "unless further edited in inventory"
 * enforceable: once it is set, restocking the part at a new cost updates
 * the cost but leaves the manager's price alone, rather than silently
 * recalculating it back to markup.
 */

export type PartPriceOverrideStatus =
  /** The inventory record was updated. */
  | "applied"
  /** The price already matched — nothing to write. */
  | "unchanged"
  /** A part bought for this job that was never stocked; nothing to update. */
  | "noInventoryLink"
  /** The person editing does not hold the charge-editing permission. */
  | "notPermitted"
  /** The linked item id no longer resolves to a record. */
  | "itemNotFound";

export type PartPriceOverrideResult = {
  status: PartPriceOverrideStatus;
  inventoryItemId?: string;
  partNumber?: string;
  previousSellPrice?: number;
  newSellPrice?: number;
  item?: InventoryItem;
};

/** Money compares at cents; float noise is not a price change. */
function toCents(value: number): number {
  return Math.round(value * 100);
}

export type ApplyManagerSellPriceOverrideInput = {
  /** The part's inventory record. Absent for an unstocked on-the-fly buy. */
  inventoryItemId?: string;

  /** The price the manager typed on the job line. */
  sellPrice: number;

  /**
   * Whether the person editing holds `editCharges`. Passed in rather than
   * read here so the caller resolves it in an effect — reading permissions
   * during render returns a different answer on the server than on the
   * client and trips a hydration mismatch.
   */
  canEditCharges: boolean;
};

export function applyManagerSellPriceOverride({
  inventoryItemId,
  sellPrice,
  canEditCharges,
}: ApplyManagerSellPriceOverrideInput): PartPriceOverrideResult {
  if (!canEditCharges) {
    return { status: "notPermitted" };
  }

  if (!inventoryItemId) {
    return { status: "noInventoryLink" };
  }

  if (!Number.isFinite(sellPrice) || sellPrice < 0) {
    return { status: "unchanged", inventoryItemId };
  }

  const existingItem = getInventoryItemById(inventoryItemId);

  if (!existingItem) {
    return { status: "itemNotFound", inventoryItemId };
  }

  const previousSellPrice = existingItem.sellPrice ?? existingItem.price ?? 0;

  /*
   * An unchanged price still should not clear an existing override — but
   * neither should merely opening and saving a line mark a system-suggested
   * price as a manager decision.
   */
  if (toCents(previousSellPrice) === toCents(sellPrice)) {
    return {
      status: "unchanged",
      inventoryItemId,
      partNumber: existingItem.partNumber,
      previousSellPrice,
      newSellPrice: sellPrice,
      item: existingItem,
    };
  }

  const updatedItem = updateInventoryItem(inventoryItemId, {
    sellPrice,
    price: sellPrice,
    sellPriceOverridden: true,
  });

  if (!updatedItem) {
    return { status: "itemNotFound", inventoryItemId };
  }

  return {
    status: "applied",
    inventoryItemId,
    partNumber: updatedItem.partNumber,
    previousSellPrice,
    newSellPrice: sellPrice,
    item: updatedItem,
  };
}

/**
 * The sentence shown to the manager after a save, so a change to a shared
 * record is never silent.
 */
export function describePartPriceOverride(
  result: PartPriceOverrideResult
): string | null {
  if (result.status !== "applied") {
    return null;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const partLabel = result.partNumber ? ` for ${result.partNumber}` : "";

  return `Inventory sell price${partLabel} updated from ${formatCurrency(
    result.previousSellPrice ?? 0
  )} to ${formatCurrency(
    result.newSellPrice ?? 0
  )}. It will hold at this price until it is edited in Inventory.`;
}
