"use server";

/**
 * listings.ts — the RentCast listings API for the whole app.
 *
 * Single module front-end components import. Every export is a Next.js Server
 * Action: it runs on the server (service-role + RentCast keys) and Next rewrites
 * client imports into RPC calls, so consumers just import and `await`:
 *
 *   import { getListings } from "@/utils/listings";
 *   const { listings, complete, total } = await getListings("Austin", "TX");
 *
 * Types: ./listings.types. Requires rentcast_cache_schema.sql.
 * Env (server-side, NOT NEXT_PUBLIC): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RENTCAST_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import type {
  SaleListing,
  GetListingsResult,
  CompContribution,
  EstimateExplanation,
  MapBounds,
  RentModelWeights,
} from "./listings.types";

// ─── Constants ───────────────────────────────────────────────────────────────
const RENTCAST_BASE = "https://api.rentcast.io/v1";
const RENTCAST_PAGE_SIZE = 500;      // RentCast max per request
const DEFAULT_SALE_LIMIT = 2000;
const DEFAULT_RENT_LIMIT = 1500;
const DEFAULT_EXPIRY_DAYS = 14;      // sale cache older than this is refetched
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY!;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// ─── Internal row shapes (snake_case, as returned by PostgREST) ──────────────
interface SaleRow {
  id: string; address: string | null; price: number | null;
  estimated_rent: number | null; annual_rent_to_price: number | null;
  bedrooms: number | null; bathrooms: number | null; square_footage: number | null;
  lot_size: number | null; year_built: number | null; age_years: number | null;
  property_type: string | null; status: string | null; days_on_market: number | null;
  latitude: number | null; longitude: number | null; raw: Record<string, unknown>;
}
interface CompRow {
  comp_id: string; rent: number; distance_m: number;
  score_distance: number; score_bedrooms: number; score_bathrooms: number;
  score_sqft: number; score_type: number; weight: number; rent_contribution: number;
}
interface RegionRow {
  sale_fetched_at: string | null; sale_count: number; sale_total: number; sale_complete: boolean;
  rental_fetched_at: string | null; rental_count: number; rental_total: number; rental_complete: boolean;
}
interface FetchConfigRow {
  sale_status: string | null; sale_property_types: string | null; sale_days_old: number | null;
  rental_status: string | null; rental_property_types: string | null; rental_days_old: number | null;
}

const SALE_COLUMNS =
  "id, address, price, estimated_rent, annual_rent_to_price, bedrooms, bathrooms, " +
  "square_footage, lot_size, year_built, age_years, property_type, status, " +
  "days_on_market, latitude, longitude, raw";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function unwrap(res: { data: unknown; error: unknown }): unknown {
  if (res.error) throw res.error;
  return res.data;
}

function mapSale(r: SaleRow): SaleListing {
  return {
    id: r.id, address: r.address, price: r.price,
    estimatedRent: r.estimated_rent, annualRentToPrice: r.annual_rent_to_price,
    bedrooms: r.bedrooms, bathrooms: r.bathrooms, squareFootage: r.square_footage,
    lotSize: r.lot_size, yearBuilt: r.year_built, ageYears: r.age_years,
    propertyType: r.property_type, status: r.status, daysOnMarket: r.days_on_market,
    latitude: r.latitude, longitude: r.longitude, raw: r.raw,
  };
}

function mapComp(r: CompRow): CompContribution {
  return {
    compId: r.comp_id, rent: r.rent, distanceM: r.distance_m,
    scoreDistance: r.score_distance, scoreBedrooms: r.score_bedrooms,
    scoreBathrooms: r.score_bathrooms, scoreSqft: r.score_sqft, scoreType: r.score_type,
    weight: r.weight, rentContribution: r.rent_contribution,
  };
}

/**
 * Fetch RentCast listings for a query, deduping by id. Reads the true total from
 * the X-Total-Count header (first page) so completeness is exact, not inferred:
 *   - dedup absorbs RentCast's overlapping pages (unstable lastSeenDate sort),
 *   - stops at min(limit, total),
 *   - complete = limit >= total (we asked for at least everything that exists).
 */
async function fetchRentCast(
  path: string,
  city: string,
  state: string,
  limit: number,
  filters: Record<string, string | number | null | undefined>,
): Promise<{ rows: unknown[]; total: number; complete: boolean }> {
  const byId = new Map<string, unknown>();
  let total = Infinity;

  for (let offset = 0; offset < limit && offset < total; offset += RENTCAST_PAGE_SIZE) {
    const url = new URL(`${RENTCAST_BASE}/${path}`);
    url.searchParams.set("city", city);
    url.searchParams.set("state", state);
    url.searchParams.set("limit", String(RENTCAST_PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    if (offset === 0) url.searchParams.set("includeTotalCount", "true");
    for (const [k, v] of Object.entries(filters)) if (v != null) url.searchParams.set(k, String(v));

    const res = await fetch(url, { headers: { "X-Api-Key": RENTCAST_API_KEY } });
    if (!res.ok) throw new Error(`RentCast ${path} → ${res.status}: ${await res.text()}`);

    if (offset === 0) {
      const tc = res.headers.get("X-Total-Count");
      if (tc != null && tc !== "") total = Number(tc);
    }
    const batch = (await res.json()) as Array<{ id: string }>;
    for (const row of batch) byId.set(row.id, row);
    if (batch.length < RENTCAST_PAGE_SIZE) {           // exhausted the list
      total = Math.min(total, offset + batch.length);
      break;
    }
  }

  const resolvedTotal = Number.isFinite(total) ? total : byId.size;
  return { rows: [...byId.values()], total: resolvedTotal, complete: limit >= resolvedTotal };
}

// ─── Public API (Server Actions) ─────────────────────────────────────────────

/**
 * Get every cached sale listing for a city, fetching from RentCast only when
 * needed. Sales are replaced when the cache holds fewer than `saleLimit` and
 * isn't already complete, or when older than `expiryDays`. Rentals (comps for
 * the estimate, never returned here) are grown the same way, without expiry.
 *
 * @returns { listings, complete, total } for sales, plus rentalCount/rentalTotal
 *          (comps cached vs. available) as a rough gauge of estimate confidence.
 */
export async function getListings(
  city: string,
  state: string,
  saleLimit: number = DEFAULT_SALE_LIMIT,
  rentLimit: number = DEFAULT_RENT_LIMIT,
  expiryDays: number = DEFAULT_EXPIRY_DAYS,
): Promise<GetListingsResult> {
  const regionId = unwrap(
    await supabase.rpc("ensure_region", { p_city: city, p_state: state }),
  ) as number;

  const cfg = unwrap(await supabase.from("fetch_config").select("*").single()) as FetchConfigRow;
  const region = unwrap(
    await supabase
      .from("regions")
      .select(
        "sale_fetched_at, sale_count, sale_total, sale_complete, " +
          "rental_fetched_at, rental_count, rental_total, rental_complete",
      )
      .eq("id", regionId)
      .single(),
  ) as RegionRow;

  // Rentals first, so the sale reprice can use them. Grow when we hold fewer
  // than asked and don't already have them all.
  let rentalCount = region.rental_count;
  let rentalTotal = region.rental_total;
  if (region.rental_count < rentLimit && !region.rental_complete) {
    const res = await fetchRentCast("listings/rental/long-term", city, state, rentLimit, {
      status: cfg.rental_status,
      propertyType: cfg.rental_property_types,
      daysOld: cfg.rental_days_old,
    });
    unwrap(
      await supabase.rpc("cache_rental_comps", {
        p_region_id: regionId, p_listings: res.rows, p_total: res.total, p_complete: res.complete,
      }),
    );
    rentalCount = res.rows.length;
    rentalTotal = res.total;
  }

  // Sales: refetch (replace) when stale, or when we hold fewer than asked and
  // aren't complete.
  let complete = region.sale_complete;
  let total = region.sale_total;
  const ageDays = region.sale_fetched_at
    ? (Date.now() - new Date(region.sale_fetched_at).getTime()) / MS_PER_DAY
    : Infinity;

  if (ageDays > expiryDays || (region.sale_count < saleLimit && !region.sale_complete)) {
    const res = await fetchRentCast("listings/sale", city, state, saleLimit, {
      status: cfg.sale_status,
      propertyType: cfg.sale_property_types,
      daysOld: cfg.sale_days_old,
    });
    unwrap(
      await supabase.rpc("refresh_sale_listings", {
        p_region_id: regionId, p_listings: res.rows, p_total: res.total, p_complete: res.complete,
      }),
    );
    complete = res.complete;
    total = res.total;
  }

  const rows = unwrap(
    await supabase
      .from("sale_listings_enriched")
      .select(SALE_COLUMNS)
      .eq("region_id", regionId)
      .order("annual_rent_to_price", { ascending: false, nullsFirst: false }),
  ) as SaleRow[];

  return { listings: rows.map(mapSale), complete, total, rentalCount, rentalTotal };
}

/**
 * Explain how a listing's rent estimate was produced: the comps used, each one's
 * distance and per-dimension scores, its weight, and its dollar contribution
 * (contributions sum to the estimate).
 * @param property a sale-listing id, or an object with an `id`.
 */
export async function explainEstimate(
  property: string | { id: string },
): Promise<EstimateExplanation> {
  const id = typeof property === "string" ? property : property.id;
  const comps = unwrap(await supabase.rpc("explain_listing_rent", { p_sale_id: id })) as CompRow[];
  const row = unwrap(
    await supabase.from("sale_listings").select("estimated_rent").eq("id", id).single(),
  ) as { estimated_rent: number | null };
  return { estimatedRent: row.estimated_rent, comps: (comps ?? []).map(mapComp) };
}

/**
 * Every already-cached sale listing inside the given map bounds, ranked by gross
 * yield. Reads only the DB — does NOT fetch from RentCast.
 */
export async function getListingsInArea(
  bounds: MapBounds,
  limit: number = DEFAULT_SALE_LIMIT,
): Promise<SaleListing[]> {
  const rows = unwrap(
    await supabase.rpc("listings_in_view", {
      min_lng: bounds.west, min_lat: bounds.south,
      max_lng: bounds.east, max_lat: bounds.north, limit_n: limit,
    }),
  ) as SaleRow[];
  return (rows ?? []).map(mapSale);
}

/**
 * Update the rent-estimation model and re-price every cached listing (one
 * set-based pass). Only the fields you pass change.
 *
 * How a comp contributes: for each property, comps within `radiusM` are scored
 * on distance + beds/baths/sqft closeness (each 1 at an exact match, ramping to
 * 0 at its tolerance) + exact property-type match, each scaled by its weight and
 * summed into the comp's weight. The top `maxComps` are kept and the estimate is
 * their weight-weighted average rent. Weights are relative (scale cancels).
 */
export async function updateRentModel(weights: RentModelWeights): Promise<void> {
  unwrap(
    await supabase.rpc("set_rent_model", {
      p_radius_m: weights.radiusM ?? null,
      p_max_comps: weights.maxComps ?? null,
      p_w_distance: weights.wDistance ?? null,
      p_w_bedrooms: weights.wBedrooms ?? null,
      p_w_bathrooms: weights.wBathrooms ?? null,
      p_w_sqft: weights.wSqft ?? null,
      p_w_property_type: weights.wPropertyType ?? null,
      p_bedroom_tolerance: weights.bedroomTolerance ?? null,
      p_bathroom_tolerance: weights.bathroomTolerance ?? null,
      p_sqft_tolerance: weights.sqftTolerance ?? null,
    }),
  );
}