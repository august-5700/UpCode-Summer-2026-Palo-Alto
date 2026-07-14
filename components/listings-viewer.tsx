"use client";

import { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getListings } from "@/utils/listings";
import type { GetListingsResult, SaleListing } from "@/utils/listings.types";
import { ListingFilter, prepareListings } from "@/utils/listings/prepareListings";
import { scoreListing } from "@/utils/listings/listingScore";
import { on } from "node:cluster";
import { cn } from "@/lib/utils";

const money = (v: number | null) => (v == null ? "—" : `$${Math.round(v).toLocaleString()}`);
const percent = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(2)}%`);
const pricePerSqft = (l: SaleListing) =>
  l.price != null && l.squareFootage != null && l.squareFootage > 0 ? l.price / l.squareFootage : null;

// Monthly HOA fee from the raw RentCast payload (0 if none).
const hoaMonthly = (l: SaleListing): number => {
  const hoa = (l.raw as { hoa?: { fee?: number } } | null)?.hoa;
  return typeof hoa?.fee === "number" ? hoa.fee : 0;
};
// Gross yield minus HOA: (estimatedRent - HOA) × 12 / price.
const netYield = (l: SaleListing): number | null => {
  if (l.price == null || l.price <= 0 || l.estimatedRent == null) return null;
  return ((l.estimatedRent - hoaMonthly(l)) * 12) / l.price;
};

interface ListingsViewerProps {
  onListingSelect: (listing: SaleListing) => void;
  data: GetListingsResult;
}

export default function ListingsViewer({ onListingSelect, data }: ListingsViewerProps) {
  const [minPpsf, setMinPpsf] = useState("");
  const [maxPpsf, setMaxPpsf] = useState("");

  // Client-side filtering of the loaded results (no refetch).
  const min = minPpsf ? Number(minPpsf) : null;
  const max = maxPpsf ? Number(maxPpsf) : null;
  const ppsfFilter: ListingFilter<SaleListing> = (l) => {
    const p = pricePerSqft(l);
    if (min != null && (p == null || p < min)) return false;
    if (max != null && (p == null || p > max)) return false;
    return true;
  };

  // Filter + rank by HOA-adjusted yield in one pass (best first).
  const ranked = prepareListings(data?.listings ?? [], [ppsfFilter], scoreListing, true);
  const hidden = (data?.listings.length ?? 0) - ranked.length;
  return (
    <>
      {/* Filters (client-side, no refetch) */}
      {data && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            $/sqft
          </span>
          <input
            value={minPpsf}
            onChange={(e) => setMinPpsf(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="min"
            className="w-20 rounded-lg border border-gray-200 bg-white/70 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          <span className="text-gray-300">-</span>
          <input
            value={maxPpsf}
            onChange={(e) => setMaxPpsf(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="max"
            className="w-20 rounded-lg border border-gray-200 bg-white/70 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          {hidden > 0 && <span className="ml-auto text-xs text-gray-400">{hidden} filtered out</span>}
        </div>
      )}

      {/* Status */}
      {data && data.rentalCount && data.rentalTotal && data.complete && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {ranked.length} listing{ranked.length === 1 ? "" : "s"}
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                data.complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {data.complete ? "complete" : "capped — more available"}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {data.rentalCount.toLocaleString()} of {data.rentalTotal.toLocaleString()} rental
            comps cached — the basis for the rent estimates
          </p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="-mx-2 flex flex-1 flex-col gap-2 overflow-y-auto px-2">
          {ranked.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              {data.listings.length === 0
                ? "No listings returned. Try a denser city or raise the limit."
                : "Every listing was filtered out. Loosen the $/sqft range."}
            </p>
          )}
          {ranked.map((l: SaleListing) => (
            <div
              key={l.id}
              className={cn("rounded-2xl border p-3 text-sm transition-all duration-150 hover:cursor-pointer",
                l.selected ? "border-emerald-400 bg-emerald-100/40 hover:bg-emerald-100/50" : "border-white/50 bg-white/40 hover:bg-white/70"
              )}
              onClick={()=>{onListingSelect(l);ranked.forEach((l: SaleListing)=>l.selected = false);l.selected = !l.selected}}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{l.address ?? "—"}</p>
                  <p className="text-xs capitalize text-gray-500">{l.propertyType ?? "property"}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-gray-900">{money(l.price)}</p>
                  <p className="text-xs font-semibold text-emerald-700">
                    {percent(netYield(l))} yield
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>Est. rent {money(l.estimatedRent)}/mo</span>
                {hoaMonthly(l) > 0 && <span>HOA {money(hoaMonthly(l))}/mo</span>}
                <span>
                  {l.bedrooms ?? "—"} bd · {l.bathrooms ?? "—"} ba
                </span>
                {l.squareFootage != null && <span>{l.squareFootage.toLocaleString()} sqft</span>}
                {pricePerSqft(l) != null && <span>{money(pricePerSqft(l))}/sqft</span>}
                {l.daysOnMarket != null && <span>{l.daysOnMarket} days on market</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}