/**
 * One band in the markup matrix: parts costing between minCost and maxCost
 * are marked up by markupPercent.
 *
 * Bands refine the general markup rather than replacing it — a cost that
 * falls outside every band uses the general percentage. That makes an empty
 * band list perfectly valid: it simply means one markup covers everything.
 *
 * maxCost of null means "and above" — an open-ended top band. At most one
 * band should be open-ended, and it must be the highest.
 */
export type MarkupTier = {
  id: string;

  minCost: number;
  maxCost: number | null;

  markupPercent: number;
};
