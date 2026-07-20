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