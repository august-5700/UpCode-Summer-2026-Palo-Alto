/**
 * listingScore.ts  (utils/listings/listingScore.ts)
 *
 * Score generation for the ranking. The score is annual gross rental yield —
 * HIGHER IS BETTER — with one adjustment: subtract the monthly HOA fee from
 * rent before annualizing, since it comes straight off what the owner nets.
 *
 * Pass this with `descending: true` to prepareListings / sortListings to put
 * the best listings at the top.
 */

import type { ScoreFunction } from "./prepareListings";
import type { SaleListing } from "@/utils/listings.types";

const UNRANKABLE = Number.NEGATIVE_INFINITY; // sinks unscorable listings

/** Monthly HOA fee from the raw RentCast payload (0 if none). */
export function hoaMonthly(l: SaleListing): number {
  const hoa = (l.raw as { hoa?: { fee?: number } } | null)?.hoa;
  return typeof hoa?.fee === "number" && hoa.fee > 0 ? hoa.fee : 0;
}

/** Rent that actually accrues to the owner: comp estimate minus HOA. */
export function netMonthlyRent(l: SaleListing): number | null {
  if (l.estimatedRent == null) return null;
  return l.estimatedRent - hoaMonthly(l);
}

/**
 * Annual HOA-adjusted gross yield against the list price.
 *   (netRent × 12) / price
 */
export function annualNetYield(l: SaleListing): number | null {
  const rent = netMonthlyRent(l);
  if (rent == null || l.price == null || l.price <= 0) return null;
  return (rent * 12) / l.price;
}

/** The score function for prepareListings — HOA-adjusted annual yield. */
export const scoreListing: ScoreFunction<SaleListing> = (l) =>
  annualNetYield(l) ?? UNRANKABLE;

/**
 * Drop yield outliers before display. The top few percent are almost always
 * data errors (a bad rent comp, a distressed/mispriced listing) rather than
 * real deals, and they crowd the top of the ranking. This needs the whole
 * distribution, so it's a set operation, not a per-listing filter — apply it
 * after scoring, right before you build map pins / the dropdown.
 */
export function dropYieldOutliers(
  listings: SaleListing[],
  percentile = 0.95,
): SaleListing[] {
  const yields = listings
    .map(annualNetYield)
    .filter((y): y is number => y != null)
    .sort((a, b) => a - b);
  if (yields.length === 0) return listings;
  const idx = Math.min(
    yields.length - 1,
    Math.floor(percentile * yields.length),
  );
  const cap = yields[idx];
  return listings.filter((l) => {
    const y = annualNetYield(l);
    return y == null || y <= cap;
  });
}