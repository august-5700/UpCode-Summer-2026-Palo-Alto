/**
 * prepareListings.ts  (utils/listings/prepareListings.ts)
 *
 * Filtering + sorting pipeline for property listings, run before they're
 * turned into map points or dropdown entries.
 *
 * A filter is a predicate: return `true` to KEEP a listing, `false` to
 * eliminate it.
 */

import type { SaleListing } from "@/utils/listings.types";
import { DEFAULT_FILTERS } from "./listingFilters";
import { scoreListing } from "./listingScore";

/** Predicate over a listing. Return true to KEEP, false to eliminate. */
export type ListingFilter<T> = (listing: T) => boolean;

/** Maps a listing to a numeric score used for ordering. */
export type ScoreFunction<T> = (listing: T) => number;

/**
 * Keep only the listings that pass EVERY filter. Returns a NEW array; the
 * input is not mutated.
 */
export function filterListings<T>(
  listings: readonly T[],
  filters: readonly ListingFilter<T>[],
): T[] {
  return listings.filter((listing) => filters.every((f) => f(listing)));
}

/**
 * Sort listings by score. Sorts IN PLACE and returns the same array.
 * Ascending by default; pass `descending: true` for best-first ordering.
 */
export function sortListings<T>(
  listings: T[],
  score: ScoreFunction<T>,
  descending = false,
): T[] {
  const dir = descending ? -1 : 1;
  return listings.sort((a, b) => dir * (score(a) - score(b)));
}

/**
 * Filter, then sort. Returns a NEW array; the caller's `listings` is untouched.
 */
export function prepareListings<T>(
  listings: readonly T[],
  filters: readonly ListingFilter<T>[],
  score: ScoreFunction<T>,
  descending = false,
): T[] {
  const filtered = filterListings(listings, filters);
  return sortListings(filtered, score, descending);
}

/**
 * THE call every view should use. Applies DEFAULT_FILTERS + the default score,
 * sorted best-first — so filtering, ranking, and sort direction stay identical
 * everywhere. Pass `extraFilters` to layer manual filters on top of the
 * baseline; the defaults still apply.
 *
 * Note: unlike the generic helpers above, this is intentionally bound to
 * SaleListing — it's the opinionated entry point, so it pulls in the concrete
 * DEFAULT_FILTERS and scoreListing.
 */
export function prepareWithDefaults(
  listings: readonly SaleListing[],
  extraFilters: ListingFilter<SaleListing>[] = [],
): SaleListing[] {
  return prepareListings(
    listings,
    [...DEFAULT_FILTERS, ...extraFilters],
    scoreListing,
    true,
  );
}