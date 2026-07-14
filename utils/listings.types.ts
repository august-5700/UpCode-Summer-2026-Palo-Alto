// listings.types.ts
//
// Shared types for the RentCast listings layer. Pure types, zero runtime code —
// safe to import from client components, server actions, or anywhere else.

/** A cached sale property with its derived rent estimate, yield, and full raw payload. */
export interface SaleListing {
  id: string;
  address: string | null;
  price: number | null;
  estimatedRent: number | null;
  /** Gross annual yield = estimatedRent × 12 / price. Null if either is missing. */
  annualRentToPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  ageYears: number | null;
  propertyType: string | null;
  status: string | null;
  daysOnMarket: number | null;
  latitude: number | null;
  longitude: number | null;
  /** The complete, unmodified RentCast listing object. */
  raw: Record<string, unknown>;
  selected: boolean;
}

export interface GetListingsResult {
  /** Every cached sale listing for the region (limit is a fetch target, not a cap). */
  listings: SaleListing[];
  /** true = the cache holds every listing RentCast has for the query; false = capped by the limit. */
  complete?: boolean;
  /** RentCast's reported total for the (filtered) query, so callers know how many exist. */
  total?: number;
  /** Rental comps fetched/cached for this region — a rough proxy for estimate confidence. */
  rentalCount?: number;
  /** RentCast's reported total of rentals available for the query. */
  rentalTotal?: number;
}

/** One comp's role in a single property's rent estimate. */
export interface CompContribution {
  compId: string;
  rent: number;
  distanceM: number;
  scoreDistance: number;
  scoreBedrooms: number;
  scoreBathrooms: number;
  scoreSqft: number;
  scoreType: number;
  /** This comp's total similarity to the subject. */
  weight: number;
  /** Dollars this comp added to the estimate. The contributions sum to the estimate. */
  rentContribution: number;
}

export interface EstimateExplanation {
  estimatedRent: number | null;
  comps: CompContribution[];
}

/** Map viewport, matching Leaflet's LatLngBounds accessors. */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Partial rent-model update — omit any field to leave it unchanged. */
export interface RentModelWeights {
  radiusM?: number;
  maxComps?: number;
  wDistance?: number;
  wBedrooms?: number;
  wBathrooms?: number;
  wSqft?: number;
  wPropertyType?: number;
  bedroomTolerance?: number;
  bathroomTolerance?: number;
  sqftTolerance?: number;
}