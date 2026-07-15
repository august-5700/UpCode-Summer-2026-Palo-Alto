import { LatLngBounds } from "leaflet"
import { createClient } from "@supabase/supabase-js";
import { computeHeatScore } from "./score";

const supabase = createClient(
  "https://vpcxcjmotpouxuiwjlpi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwY3hjam1vdHBvdXh1aXdqbHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDU3NDYsImV4cCI6MjA5NzcyMTc0Nn0.mz2E2rOTdBAk34OEGF-KSr5NgPDvnceg8Ayv2cSpMqw"
);

export const fetchGeoDataForPoint = async (lat:number, lon:number) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
  if (!res.ok) {
    throw new Error("Response failed with status " + res.status);
  }
  return res.json()
}

export async function getCounties() {
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

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const money = (v: number | null) =>
  v == null ? "N/A" : "$" + Math.round(v).toLocaleString();

export async function getBlockByCoords(
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

export async function getCountyByCoords(
  lat: number,
  lng: number
): Promise<TractData | null> {
  let counties: any[] = [];
  for (const d of [1, 3, 6]) {
    const { data, error } = await supabase
      .from("counties")
      .select("*")
      .gte("lat", lat - d)
      .lte("lat", lat + d)
      .gte("long", lng - d)
      .lte("long", lng + d)
      .limit(4000);
    if (error) {
      console.error(error);
      return null;
    }
    if (data && data.length) {
      counties = data;
      break;
    }
  }
  if (!counties.length) return null;

  let county = counties[0];
  let best = Infinity;
  for (const c of counties) {
    const dist = (c.lat - lat) ** 2 + (c.long - lng) ** 2;
    if (dist < best) {
      best = dist;
      county = c;
    }
  }

  const homeValue = num(county.median_home_value);
  const homeMoe = num(county.median_home_value_moe);
  const rent = num(county.median_gross_rent);
  const totalUnits = num(county.total_housing_units);
  const vacant = num(county.vacant_units);

  const vacancyRate = totalUnits ? ((vacant ?? 0) / totalUnits) * 100 : null;
  const priceToRent = homeValue && rent ? homeValue / (rent * 12) : null;

  const score = computeHeatScore(
    county.median_home_value,
    county.median_gross_rent,
    county.total_housing_units,
    county.occupied_units
  );

  return {
    title: `${county.name} County`,
    score,
    regional: null,
    national: null,
    metrics: [
      { label: "Median Home Value", value: money(homeValue), sub: homeMoe ? `±${money(homeMoe)}` : "", icon: "home" },
      { label: "Median Gross Rent", value: rent ? `${money(rent)}/mo` : "N/A", icon: "dollar" },
      { label: "Vacancy Rate", value: vacancyRate != null ? `${vacancyRate.toFixed(1)}%` : "N/A", icon: "building" },
      { label: "Price-to-Rent", value: priceToRent != null ? `${priceToRent.toFixed(1)}×` : "N/A", icon: "building" },
    ],
  };
}

export async function getBlocksWithinRange(bounds: LatLngBounds) {
 
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .gte("lat", bounds.getSouth())
    .lte("lat", bounds.getNorth())
    .gte("long", bounds.getWest())
    .lte("long", bounds.getEast())
    .limit(50000);

  if (error) {
    console.error("Error fetching blocks:", error);
    return [];
  }
  return data;
}







import { LatLngTuple } from "leaflet";
import { TractData } from "./types";

var requestOptions = {
  method: 'GET',
};

export async function getResultFromAddressAutocomplete(input: String, bias: LatLngTuple | null) {
  if (input) {
    const limit = 5
    let res = null
    console.log(typeof window)
    console.log(process.env.NEXT_PUBLIC_ADDRESS_AUTOCOMPLETE_API_KEY)
    if (bias) {
      res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&limit=${limit}&filter=countrycode%3Aus&bias=proximity%3A${bias[0]}%2C${bias[1]}&apiKey=${process.env.NEXT_PUBLIC_ADDRESS_AUTOCOMPLETE_API_KEY}`, requestOptions)
    } else {
      res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${input}&limit=${limit}&filter=countrycode%3Aus&apiKey=${process.env.NEXT_PUBLIC_ADDRESS_AUTOCOMPLETE_API_KEY}`, requestOptions)
    }
  
    
    if (!res.ok) {
      throw new Error("Response failed with status " + res.status);
    }
    const json = res.json()
    // console.log(json)
    return json
  } else {
    return {}
  }
}

export async function getCountyByCityState(
  item: string[]
): Promise<TractData | null> {
  if (item.length < 2) return null;

  const [city, state] = item;

  const query = encodeURIComponent(`${city}, ${state}, USA`);

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  );

  if (!res.ok) {
    throw new Error(`Geocoding failed with status ${res.status}`);
  }

  const results = await res.json();

  if (!results.length) {
    return null;
  }

  const lat = Number(results[0].lat);
  const lng = Number(results[0].lon);

  return getCountyByCoords(lat, lng);
}