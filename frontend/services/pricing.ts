import type { MarkupTier } from "@/types/pricing";

import { getAppSettings } from "@/services/app-settings";

function safeNumber(value: unknown, fallback = 0): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function createMarkupTierId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tier-${crypto.randomUUID()}`;
  }

  return `tier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Lowest band first. An open-ended band (maxCost null) always sorts last,
 * since nothing can sit above it.
 */
export function sortMarkupTiers(tiers: MarkupTier[]): MarkupTier[] {
  return [...tiers].sort((a, b) => {
    if (a.maxCost === null && b.maxCost !== null) {
      return 1;
    }

    if (b.maxCost === null && a.maxCost !== null) {
      return -1;
    }

    return a.minCost - b.minCost;
  });
}

/**
 * The band a given cost falls into, or null when it falls through a gap.
 * Bands are inclusive at both ends of the range they cover.
 */
export function findMarkupTierForCost(
  cost: number,
  tiers: MarkupTier[]
): MarkupTier | null {
  const safeCost = safeNumber(cost);

  return (
    sortMarkupTiers(tiers).find((tier) => {
      if (safeCost < tier.minCost) {
        return false;
      }

      return tier.maxCost === null || safeCost <= tier.maxCost;
    }) ?? null
  );
}

export type MarkupTierValidation = {
  errors: string[];
  warnings: string[];
};

/**
 * Bands must not overlap — a cost that matches two rules has no single
 * right answer. Gaps are reported as warnings rather than errors: they are
 * survivable, because a cost that matches nothing falls back to the flat
 * percentage, but they are almost always a mistake.
 */
export function validateMarkupTiers(tiers: MarkupTier[]): MarkupTierValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // No bands at all is a valid configuration: the general markup covers
  // every cost on its own.
  if (tiers.length === 0) {
    return { errors, warnings };
  }

  const sortedTiers = sortMarkupTiers(tiers);

  sortedTiers.forEach((tier) => {
    if (tier.maxCost !== null && tier.maxCost < tier.minCost) {
      errors.push(
        `A rule ends ($${tier.maxCost.toFixed(2)}) below where it starts ($${tier.minCost.toFixed(2)}).`
      );
    }

    if (tier.minCost < 0) {
      errors.push("A rule starts below $0.");
    }
  });

  const openEndedTiers = sortedTiers.filter((tier) => tier.maxCost === null);

  if (openEndedTiers.length > 1) {
    errors.push(
      "Only one rule can be open-ended. Give the others an upper limit."
    );
  }

  if (openEndedTiers.length === 0) {
    const highestTier = sortedTiers[sortedTiers.length - 1];

    warnings.push(
      `Costs above $${(highestTier.maxCost ?? 0).toFixed(2)} use the general markup.`
    );
  }

  for (let index = 1; index < sortedTiers.length; index += 1) {
    const previousTier = sortedTiers[index - 1];
    const currentTier = sortedTiers[index];

    if (previousTier.maxCost === null) {
      // Already reported as a multiple-open-ended error above.
      continue;
    }

    if (currentTier.minCost <= previousTier.maxCost) {
      errors.push(
        `Rules overlap between $${currentTier.minCost.toFixed(2)} and $${previousTier.maxCost.toFixed(2)}.`
      );

      continue;
    }

    const gapStart = previousTier.maxCost;
    const gapEnd = currentTier.minCost;

    // Bands are inclusive, so touching bands look like 50.00 -> 50.01.
    // Anything wider than a cent is a real gap.
    if (gapEnd - gapStart > 0.011) {
      warnings.push(
        `Costs between $${gapStart.toFixed(2)} and $${gapEnd.toFixed(2)} use the general markup.`
      );
    }
  }

  return { errors, warnings };
}

/**
 * Suggested retail = cost plus markup. Rounded to cents so the number that
 * lands on an invoice line is the one the user saw on screen.
 */
export function calculateSellPriceFromCost(
  cost: number,
  markupPercent: number
): number {
  const safeCost = safeNumber(cost);
  const safeMarkup = safeNumber(markupPercent);

  if (safeCost <= 0) {
    return 0;
  }

  return Math.round(safeCost * (1 + safeMarkup / 100) * 100) / 100;
}

export type MarkupSettingsSnapshot = {
  /** The general markup, applied wherever no band matches. */
  generalPercent: number;

  /** Optional cost bands that override the general markup in their range. */
  tiers: MarkupTier[];
};

/**
 * Reads the markup configuration once, so a caller that prices repeatedly
 * (a form recalculating on every keystroke) is not re-reading storage.
 */
export function getMarkupSettings(): MarkupSettingsSnapshot {
  const settings = getAppSettings();

  return {
    generalPercent: safeNumber(settings.partsMarkupPercent),
    tiers: settings.partsMarkupTiers ?? [],
  };
}

/**
 * The markup that applies to a particular cost: a matching cost band if
 * there is one, otherwise the general markup. Both rules are live at the
 * same time — bands are refinements, and any gap between them is covered by
 * the general percentage rather than pricing at zero margin.
 */
export function resolveMarkupPercent(
  cost: number,
  markupSettings: MarkupSettingsSnapshot
): number {
  const matchedTier = findMarkupTierForCost(cost, markupSettings.tiers);

  return matchedTier ? matchedTier.markupPercent : markupSettings.generalPercent;
}

export function calculateSuggestedSellPrice(
  cost: number,
  markupSettings: MarkupSettingsSnapshot
): number {
  return calculateSellPriceFromCost(
    cost,
    resolveMarkupPercent(cost, markupSettings)
  );
}

/**
 * One-shot convenience for callers pricing a single item.
 */
export function getSuggestedSellPrice(cost: number): number {
  return calculateSuggestedSellPrice(cost, getMarkupSettings());
}

export function getPartsMarkupPercent(): number {
  return getAppSettings().partsMarkupPercent;
}
