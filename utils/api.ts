export const fetchGeoDataForPoint = async (lat:number, lon:number) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
  if (!res.ok) {
    throw new Error("Response failed with status " + res.status);
  }
  return res.json()
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://vpcxcjmotpouxuiwjlpi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwY3hjam1vdHBvdXh1aXdqbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDU3NDYsImV4cCI6MjA5NzcyMTc0Nn0.mz2E2rOTdBAk34OEGF-KSr5NgPDvnceg8Ayv2cSpMqw"
);

export default async function getCounties() {
  const { data, error } = await supabase
    .from("counties")
    .select("*");
  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getBlocks() {
  const { data, error } = await supabase
  .from("blocks")
  .select("*");

  if (error) {
  console.error("Error fetching blocks:", error);
  return [];
  }
  console.log("blocks was called")
  console.log(data)
  return data;
}

/**
 * HeatMap Score (0–10)
 * -Gross rental yield  (annual rent ÷ home value) — cash flow   [60%]
 * -Occupancy rate      (occupied ÷ total units) — demand      [40%]
 */
export function computeHeatScore(
  medianHomeValue: number | string | null | undefined,
  medianGrossRent: number | string | null | undefined,
  totalHousingUnits: number | string | null | undefined,
  occupiedUnits: number | string | null | undefined
): number {
  const clean = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  const home = clean(medianHomeValue);
  const rent = clean(medianGrossRent);
  const total = clean(totalHousingUnits);
  const occupied = clean(occupiedUnits);

  const parts: { value: number; weight: number }[] = [];

  // 1) Gross rental yield → 0..10 (8% annual gross yield = a 10)
  if (home && rent) {
    const yieldPct = ((rent * 12) / home) * 100;
    parts.push({ value: clamp((yieldPct / 8) * 10, 0, 10), weight: 0.6 });
  }

  // 2) Occupancy → 0..10 (70% occupancy = 0, 98%+ = 10)
  if (total && occupied != null) {
    const occ = occupied / total;
    parts.push({ value: clamp(((occ - 0.7) / (0.98 - 0.7)) * 10, 0, 10), weight: 0.4 });
  }

  if (parts.length === 0) return 0;
  const w = parts.reduce((s, p) => s + p.weight, 0);
  return Number((parts.reduce((s, p) => s + p.value * p.weight, 0) / w).toFixed(1));
}


// ---- Sidebar data --~~~:::::::

export type Metric = {
  label: string;
  value: string;
  sub?: string;
  icon: "home" | "dollar" | "building";
};

export type TractData = {
  title: string;
  score: number;
  regional: number | null;
  national: number | null;
  metrics: Metric[];
};


const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const money = (v: number | null) =>
  v == null ? "N/A" : "$" + Math.round(v).toLocaleString();

export async function getTractByCoords(
  lat: number,
  lng: number
): Promise<TractData | null> {
  // first: Candidate blocks near the click. Widen the box until we hit data
  //    (or give up over oceans / empty areas).
  let blocks: any[] = [];
  for (const d of [0.15, 0.5, 1.5]) {
    const { data, error } = await supabase
      .from("blocks")
      .select("*")
      .gte("lat", lat - d)
      .lte("lat", lat + d)
      .gte("long", lng - d)
      .lte("long", lng + d)
      .limit(3000);
    if (error) {
      console.error(error);
      return null;
    }
    if (data && data.length) {
      blocks = data;
      break;
    }
  }
  if (!blocks.length) return null;

  // 2. Nearest block (good enough for this)
  let block = blocks[0];
  let best = Infinity;
  for (const b of blocks) {
    const dist = (b.lat - lat) ** 2 + (b.long - lng) ** 2;
    if (dist < best) {
      best = dist;
      block = b;
    }
  }

  // 3.County NAME from shared FIPS codes (NOT counties.id)
  const { data: county } = await supabase
    .from("counties")
    .select("name")
    .eq("state_fip", block.state_fip)
    .eq("county_fip", block.county_fip)
    .maybeSingle();

  // 4. for the sidebar
  const homeValue = num(block.median_home_value);
  const homeMoe = num(block.median_home_value_moe);
  const rent = num(block.median_gross_rent);
  const totalUnits = num(block.total_housing_units);
  const vacant = num(block.vacant_units);

  const vacancyRate = totalUnits ? ((vacant ?? 0) / totalUnits) * 100 : null;
  const priceToRent = homeValue && rent ? homeValue / (rent * 12) : null;
  
  //HEAT SCORE CALCULATION
  const score = computeHeatScore(
    block.median_home_value,
    block.median_gross_rent,
    block.total_housing_units,
    block.occupied_units
  );
  

  return {
    title: `${county?.name ?? "Unknown County"} · Tract ${block.tract_code}`,
    score,
    regional: null, // TODO: needs a percentile across the dataset (we can use Postgres RPC)
    national: null, // TODO same reason as above
    metrics: [
      { label: "Median Home Value", value: money(homeValue), sub: homeMoe ? `±${money(homeMoe)}` : "", icon: "home" },
      { label: "Median Gross Rent", value: rent ? `${money(rent)}/mo` : "N/A", icon: "dollar" },
      { label: "Vacancy Rate", value: vacancyRate != null ? `${vacancyRate.toFixed(1)}%` : "N/A", icon: "building" },
      { label: "Price-to-Rent", value: priceToRent != null ? `${priceToRent.toFixed(1)}×` : "N/A", icon: "building" },
    ],
  };
}

export async function getBlocksWithinRange(map: L.Map) {

  const bounds = map.getBounds();
  const lowest = bounds.getSouth();
  const highest = bounds.getNorth();
  const leftmost = bounds.getWest();
  const rightmost = bounds.getEast();

  const { data, error } = await supabase
  .from("blocks")
  .select("* WHERE lat >= $(lowest) AND lat <= $(highest) AND long >= $(leftmost) AND long <= $(rightmost) LIMIT 3000");

  if (error) {
  console.error("Error fetching blocks:", error);
  return [];
  }
  console.log("block range was called")
  console.log(data)
  return data;
}