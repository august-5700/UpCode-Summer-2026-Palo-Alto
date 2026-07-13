/**
 * prepareListings.ts  (utils/listings/prepareListings.ts)
 *
 * Filtering + sorting pipeline for property listings, run before they're
 * turned into map points or dropdown entries.
 *
 * A filter is a predicate: return `true` to KEEP a listing, `false` to
 * eliminate it.
 */

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