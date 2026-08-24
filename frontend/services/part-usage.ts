import type { PartUsage, StockingSuggestion } from "@/types/part-usage";

import { getAppSettings } from "@/services/app-settings";
import { getInventoryItems } from "@/services/inventory";

export const PART_USAGE_UPDATED_EVENT = "t1eq-part-usage-updated";

const STORAGE_KEY = "t1eq-part-usage";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `USE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createTimestamp() {
  return new Date().toISOString();
}

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function normalizePartNumber(partNumber: string): string {
  return partNumber.trim().toLowerCase();
}

export function getPartUsage(): PartUsage[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue) ? (parsedValue as PartUsage[]) : [];
  } catch (error) {
    console.error("Failed to parse part usage history.", error);

    return [];
  }
}

function savePartUsage(usageRecords: PartUsage[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(usageRecords));
  window.dispatchEvent(new CustomEvent(PART_USAGE_UPDATED_EVENT));
}

export type RecordPartUsageInput = Omit<
  PartUsage,
  "id" | "createdDate" | "extendedSellTotal" | "usedDate"
> & {
  usedDate?: string;
};

export function recordPartUsage(input: RecordPartUsageInput): PartUsage {
  const timestamp = createTimestamp();

  const quantity = safeNumber(input.quantity);
  const sellPrice = safeNumber(input.sellPrice);

  const usageRecord: PartUsage = {
    ...input,
    id: createId(),
    quantity,
    cost: safeNumber(input.cost),
    sellPrice,
    extendedSellTotal: Math.round(quantity * sellPrice * 100) / 100,
    usedDate: input.usedDate ?? timestamp,
    createdDate: timestamp,
  };

  savePartUsage([usageRecord, ...getPartUsage()]);

  return usageRecord;
}

export function getPartUsageByPartNumber(partNumber: string): PartUsage[] {
  const normalized = normalizePartNumber(partNumber);

  return getPartUsage().filter(
    (usageRecord) => normalizePartNumber(usageRecord.partNumber) === normalized
  );
}

export function getPartUsageByRepairOrderId(
  repairOrderId: string
): PartUsage[] {
  return getPartUsage().filter(
    (usageRecord) => usageRecord.repairOrderId === repairOrderId
  );
}

/**
 * Part numbers already in the catalog. A part the shop stocks is handled by
 * the normal low-stock reorder path, so it is never a *stocking* suggestion.
 */
function getStockedPartNumbers(): Set<string> {
  return new Set(
    getInventoryItems().map((item) => normalizePartNumber(item.partNumber))
  );
}

function isWithinLookback(usedDate: string, cutoffTime: number): boolean {
  const usedTime = new Date(usedDate).getTime();

  if (Number.isNaN(usedTime)) {
    return false;
  }

  return usedTime >= cutoffTime;
}

/**
 * Parts the shop keeps buying at counter price but does not stock, which
 * have crossed the threshold configured in Setup → Parts.
 *
 * Either measure is enough on its own: enough separate jobs (recurring
 * demand), or enough total pieces (a consumable). Ranked with the strongest
 * demand first.
 */
export function getStockingSuggestions(): StockingSuggestion[] {
  const settings = getAppSettings();

  const {
    stockingThresholdJobs,
    stockingThresholdQuantity,
    stockingLookbackDays,
  } = settings;

  const cutoffTime =
    Date.now() - safeNumber(stockingLookbackDays, 180) * 24 * 60 * 60 * 1000;

  const stockedPartNumbers = getStockedPartNumbers();

  const candidateUsage = getPartUsage().filter(
    (usageRecord) =>
      usageRecord.source === "Bought On The Fly" &&
      !stockedPartNumbers.has(normalizePartNumber(usageRecord.partNumber)) &&
      isWithinLookback(usageRecord.usedDate, cutoffTime)
  );

  const groupedByPartNumber = new Map<string, PartUsage[]>();

  candidateUsage.forEach((usageRecord) => {
    const key = normalizePartNumber(usageRecord.partNumber);
    const existingGroup = groupedByPartNumber.get(key);

    if (existingGroup) {
      existingGroup.push(usageRecord);
      return;
    }

    groupedByPartNumber.set(key, [usageRecord]);
  });

  const suggestions: StockingSuggestion[] = [];

  groupedByPartNumber.forEach((usageRecords) => {
    // One job fitting six of something is one job, not six — count the
    // distinct jobs so a single large repair cannot look like demand.
    const jobKeys = new Set(
      usageRecords.map(
        (usageRecord) =>
          usageRecord.repairOrderId ??
          usageRecord.scheduleEventId ??
          usageRecord.id
      )
    );

    const jobCount = jobKeys.size;

    const totalQuantity = usageRecords.reduce(
      (total, usageRecord) => total + usageRecord.quantity,
      0
    );

    const metJobThreshold = jobCount >= safeNumber(stockingThresholdJobs, 3);
    const metQuantityThreshold =
      totalQuantity >= safeNumber(stockingThresholdQuantity, 10);

    if (!metJobThreshold && !metQuantityThreshold) {
      return;
    }

    const totalCost = usageRecords.reduce(
      (total, usageRecord) => total + usageRecord.cost * usageRecord.quantity,
      0
    );

    const sortedDates = usageRecords
      .map((usageRecord) => usageRecord.usedDate)
      .sort();

    const mostRecent = usageRecords.reduce((latest, usageRecord) =>
      usageRecord.usedDate > latest.usedDate ? usageRecord : latest
    );

    suggestions.push({
      partNumber: mostRecent.partNumber,
      description: mostRecent.description,
      manufacturer: mostRecent.manufacturer,

      jobCount,
      totalQuantity,

      averageCost:
        totalQuantity > 0
          ? Math.round((totalCost / totalQuantity) * 100) / 100
          : 0,

      totalSellValue:
        Math.round(
          usageRecords.reduce(
            (total, usageRecord) => total + usageRecord.extendedSellTotal,
            0
          ) * 100
        ) / 100,

      firstUsedDate: sortedDates[0],
      lastUsedDate: sortedDates[sortedDates.length - 1],

      metJobThreshold,
      metQuantityThreshold,
    });
  });

  return suggestions.sort((a, b) => {
    if (b.jobCount !== a.jobCount) {
      return b.jobCount - a.jobCount;
    }

    return b.totalQuantity - a.totalQuantity;
  });
}

/**
 * Sales history for one part number — what it cost, what it sold for, and
 * the margin, across every job that used it.
 */
export function getPartSalesSummary(partNumber: string) {
  const usageRecords = getPartUsageByPartNumber(partNumber);

  const totalQuantity = usageRecords.reduce(
    (total, usageRecord) => total + usageRecord.quantity,
    0
  );

  const totalCost = usageRecords.reduce(
    (total, usageRecord) => total + usageRecord.cost * usageRecord.quantity,
    0
  );

  const totalRevenue = usageRecords.reduce(
    (total, usageRecord) => total + usageRecord.extendedSellTotal,
    0
  );

  return {
    partNumber,
    usageCount: usageRecords.length,
    totalQuantity,
    totalCost: Math.round(totalCost * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalMargin: Math.round((totalRevenue - totalCost) * 100) / 100,
  };
}
