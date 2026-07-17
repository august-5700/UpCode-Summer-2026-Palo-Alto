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

export const SUS_PPSF = {
  // $/sqft below this is almost never a real arms-length sale — data errors,
  // non-arms-length transfers, or severe distress. Because price is the yield
  // denominator, these surface as fake sky-high yields, so we drop them.
  min: 20,
  // $/sqft above this usually means a bad square-footage value (a tiny recorded
  // footage) rather than a real luxury home. GLOBAL + coarse: raise it for
  // high-cost coastal markets (Palo Alto, etc.) where real $/sqft runs high.
  max: 3000,
} as const;

/**
 * Default property-type policy: `type → keep?`. Anything set to `false` is
 * excluded everywhere via DEFAULT_FILTERS. Land has no rent, so it can't be
 * yield-ranked — off by default. Flip a flag here to change behavior app-wide.
 * (Matching is case-insensitive, so "Land" / "land" are the same.)
 */
export const DEFAULT_PROPERTY_TYPES: Record<string, boolean> = {
  "Single Family": true,
  Condo: true,
  Townhouse: true,
  "Multi-Family": true,
  Apartment: true,
  Manufactured: true, // kept; leased-land ones handled by excludeLeasedLand
  Land: false,
};

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

/**
 * Suspicious price-per-sqft guard — runs automatically, no UI. Drops listings
 * whose $/sqft is implausibly low or high (SUS_PPSF), the usual signature of a
 * data error or non-arms-length deal that would otherwise show up as a fake
 * top-yield result. Listings with no computable $/sqft (missing price or sqft)
 * are left alone here — requireRankableData handles the missing-price case.
 */
export const excludeSuspiciousPpsf: ListingFilter<SaleListing> = (l) => {
  const ppsf = pricePerSqft(l);
  if (ppsf == null) return true; // can't judge; don't drop on this basis
  return ppsf >= SUS_PPSF.min && ppsf <= SUS_PPSF.max;
};

/**
 * Allow/deny by property type. Pass a `type → keep?` map; any type explicitly
 * set to `false` is excluded (e.g. `{ Land: false }` drops land). Types not in
 * the map — and null types — are KEPT, so a new type never silently vanishes;
 * only an explicit `false` excludes. Case-insensitive.
 */
export function makePropertyTypeFilter(
  allowed: Record<string, boolean>,
): ListingFilter<SaleListing> {
  const denied = new Set(
    Object.entries(allowed)
      .filter(([, keep]) => !keep)
      .map(([type]) => type.toLowerCase()),
  );
  return (l) => !denied.has(norm(l.propertyType));
}

/** The default property-type filter, built from DEFAULT_PROPERTY_TYPES. */
export const excludeDeniedPropertyTypes: ListingFilter<SaleListing> =
  makePropertyTypeFilter(DEFAULT_PROPERTY_TYPES);

// ─── Manual filters (from UI state, layered on top of the defaults) ──────
export interface ManualFilters {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxDaysOnMarket?: number;
  minYield?: number; // annual GROSS yield, e.g. 0.06 = 6% (coarse pre-filter)
  propertyTypes?: Set<string>; // ALLOW-LIST: empty/undefined ⇒ allow all
}

/**
 * Collapse all the UI-driven manual filters into one predicate. `propertyTypes`
 * is an ALLOW-LIST — when non-empty, only listed types survive. minYield is a
 * coarse GROSS pre-filter (rent×12/price); the authoritative HOA-adjusted
 * ranking is listingScore.ts's job, so keep this loose.
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

export interface ManualExcludeFilters {
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxDaysOnMarket?: number;
  minYield?: number; // annual GROSS yield, e.g. 0.06 = 6% (coarse pre-filter)
  excludePropertyTypes?: Set<string> | string[]; // DENY-LIST: these are DROPPED
}

/**
 * Deny-list sibling of makeManualFilter. Same numeric knobs, but property types
 * are EXCLUDED rather than allow-listed: everything is kept except the types
 * you name, so you can drop `Land` without enumerating all the types you want.
 * Types not listed — and null types — are kept. Matching is case-insensitive.
 */
export function makeManualExcludeFilter(
  m: ManualExcludeFilters,
): ListingFilter<SaleListing> {
  const denied = new Set(
    [...(m.excludePropertyTypes ?? [])].map((t) => t.toLowerCase()),
  );
  return (l) => {
    if (m.minPrice != null && (l.price ?? 0) < m.minPrice) return false;
    if (m.maxPrice != null && (l.price ?? Infinity) > m.maxPrice) return false;
    if (m.minBeds != null && (l.bedrooms ?? 0) < m.minBeds) return false;
    if (m.maxDaysOnMarket != null && (l.daysOnMarket ?? 0) > m.maxDaysOnMarket)
      return false;
    if (denied.size && denied.has(norm(l.propertyType))) return false;
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
  excludeSuspiciousPpsf,
  excludeDeniedPropertyTypes,
];