import type { SaleListing } from './listings.types';

export type GeoData = {
    name: string;
    lat: number;
    lng: number;
    county: string;
    bbox: [number, number, number, number];
}

export type MarkerType = {
    lat?: number | null;
    lng?: number | null;
    address: string | null;
    highlighted: true | false;
    [key: string]: any;
};

export type SidebarValue = null | 'block' | 'county' | 'listing';

// The single, unified description of what the sidebar is showing.
// Invariant: the sidebar never holds more than one *type* of data at once.
// It may hold several *sets* of the same type (that's comparison view):
//   - county/block: many TractData regions
//   - listing:      many SaleListing "comparing" columns
// `level` tells the sidebar what it's rendering; the payload is the data.
export type SidebarContent =
  | { level: null }
  | { level: 'block' | 'county'; regions: TractData[] }
  | {
      level: 'listing';
      /** Place name used for the header and for trimming listing addresses. */
      title: string;
      /** The single region these listings belong to (shown only in browse view). */
      region: TractData | null;
      /** Full browsable list of listings for the area. */
      listings: SaleListing[];
      /** Listings picked for side-by-side comparison. >= 2 => comparison view. */
      comparing: SaleListing[];
      /** Optional listing-fetch metadata for the browse status line. */
      meta?: { complete?: boolean; rentalCount?: number; rentalTotal?: number };
    };

export type Metric = {
  label: string;
  value: string;
  sub?: string;
  icon: "home" | "dollar" | "building";
};

export type TractData = {
  title: string;
  score: number | null;
  regional: number | null;
  national: number | null;
  metrics: Metric[];
};