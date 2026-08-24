/**
 * Where the part came from at the moment it was used.
 *
 * "Bought On The Fly" is a technician buying it mid-job — the case that
 * feeds stocking suggestions, because the shop is paying counter price for
 * something it does not keep.
 */
export type PartUsageSource = "Stock" | "Bought On The Fly";

/**
 * One part, used once, on one job. This is the sales history behind a part
 * number: what it cost, what it sold for, and when.
 *
 * Deliberately flat and denormalized — a usage record keeps the part number
 * and description it was sold under, so history stays truthful even if the
 * catalog entry is later renamed or deleted.
 */
export type PartUsage = {
  id: string;

  partNumber: string;
  description: string;
  manufacturer?: string;

  quantity: number;

  cost: number;
  sellPrice: number;

  /**
   * quantity × sellPrice at the time of use. Stored rather than derived so
   * a later price change cannot rewrite past revenue.
   */
  extendedSellTotal: number;

  source: PartUsageSource;

  /**
   * Set when the part was in the catalog at the time of use. Absent for a
   * part bought on the fly that was never stocked.
   */
  inventoryItemId?: string;

  repairOrderId?: string;
  repairOrderNumber?: string;

  scheduleEventId?: string;

  actionItemId?: string;

  technicianId?: string;
  technicianName?: string;

  usedDate: string;

  createdDate: string;
};

/**
 * A part the shop keeps buying but does not stock, which has crossed the
 * threshold set in Setup → Parts.
 */
export type StockingSuggestion = {
  partNumber: string;
  description: string;
  manufacturer?: string;

  /** Separate jobs that used it inside the lookback window. */
  jobCount: number;

  /** Total pieces used inside the lookback window. */
  totalQuantity: number;

  /** Average of what the shop paid per piece, for pricing a first order. */
  averageCost: number;

  /** What those pieces sold for in total — the revenue at stake. */
  totalSellValue: number;

  firstUsedDate: string;
  lastUsedDate: string;

  /** Which measure(s) crossed the line — shown so the suggestion explains itself. */
  metJobThreshold: boolean;
  metQuantityThreshold: boolean;
};
