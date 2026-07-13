/**
 * listingFilters.ts  (utils/listings/listingFilters.ts)
 *
 * Every filter is a `ListingFilter<SaleListing>` — a predicate that returns
 * `true` to KEEP a listing and `false` to eliminate it. Drop these into
 * `prepareListings(listings, filters, scoreListing, true)`.
 *
 * The edge case that matters here is manufactured homes on leased land: their
 * tiny price hides an unpriced lot rent, so they produce fake 40%+ yields and
 * rocket to the top of a naive ranking.
 */

import type { ListingFilter } from "./prepareListings";
import type { SaleListing } from "@/utils/listings.types";

// ─── Tunable thresholds (mirror your rent_model config) ──────────────────
export const LEASED_LAND = {
  // Manufactured + $/sqft at/below this regional floor ⇒ likely chattel on
  // leased land. If a listing carries a per-region `regionPpsfFloor` (e.g. the
  // P2 of $/sqft from your region cache), that wins; this is the fallback.
  fallbackPpsfFloor: 40,
} as const;

// ─── Low-level helpers ───────────────────────────────────────────────────
const norm = (s: string | null | undefined): string => (s ?? "").toLowerCase();

export const pricePerSqft = (l: SaleListing): number | null =>
  l.price != null && l.squareFootage != null && l.squareFootage > 0
    ? l.price / l.squareFootage
    : null;

const MANUFACTURED_TYPES = new Set(["manufactured", "mobile"]);
export const isManufactured = (l: SaleListing): boolean =>
  MANUFACTURED_TYPES.has(norm(l.propertyType));

/**
 * Manufactured home whose $/sqft sits at/below the regional floor — almost
 * always chattel on leased land, where the tiny price hides an unpriced lot
 * rent. A manufactured home on OWNED land won't trip this (its $/sqft is
 * normal), which is the point.
 */
export function leasedLandSuspected(l: SaleListing): boolean {
  if (!isManufactured(l)) return false;
  const ppsf = pricePerSqft(l);
  if (ppsf == null) return false;
  const floor =
    (l as { regionPpsfFloor?: number | null }).regionPpsfFloor ??
    LEASED_LAND.fallbackPpsfFloor;
  return ppsf <= floor;
}

// ─── Filters (true = keep) ───────────────────────────────────────────────

/** Drop anything we can't rank at all — no price or no rent ⇒ NaN yield. */
export const requireRankableData: ListingFilter<SaleListing> = (l) =>
  l.price != null && l.price > 0 && l.estimatedRent != null;

/**
 * Manufactured on suspected leased land. We EXCLUDE these from the ranking
 * (rather than fabricate a lot-rent haircut we can't source) and surface them
 * separately with a "verify land status" note.
 */
export const excludeLeasedLand: ListingFilter<SaleListing> = (l) =>
  !leasedLandSuspected(l);

// ─── Manual filters (from UI state) ──────────────────────────────────────
export interface ManualFilters {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxDaysOnMarket?: number;
  minYield?: number; // annual GROSS yield, e.g. 0.06 = 6% (coarse pre-filter)
  propertyTypes?: Set<string>; // empty/undefined ⇒ allow all
}

/**
 * Collapse all the UI-driven manual filters into one predicate. minYield here
 * is a coarse GROSS pre-filter (rent×12/price) — the authoritative,
 * HOA-adjusted ranking is listingScore.ts's job, so keep this loose.
 */
export function makeManualFilter(m: ManualFilters): ListingFilter<SaleListing> {
  return (l) => {
    if (m.minPrice != null && (l.price ?? 0) < m.minPrice) return false;
    if (m.maxPrice != null && (l.price ?? Infinity) > m.maxPrice) return false;
    if (m.minBeds != null && (l.bedrooms ?? 0) < m.minBeds) return false;
    if (m.maxDaysOnMarket != null && (l.daysOnMarket ?? 0) > m.maxDaysOnMarket)
      return false;
    if (m.propertyTypes?.size && !m.propertyTypes.has(l.propertyType ?? ""))
      return false;
    if (m.minYield != null) {
      const y =
        l.estimatedRent != null && l.price ? (l.estimatedRent * 12) / l.price : 0;
      if (y < m.minYield) return false;
    }
    return true;
  };
}

/** Baseline data-quality filters, safe to always apply. */
export const DEFAULT_FILTERS: ListingFilter<SaleListing>[] = [
  requireRankableData,
  excludeLeasedLand,
];