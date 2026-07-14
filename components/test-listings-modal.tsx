"use client";

import { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getListings } from "@/utils/listings";
import type { GetListingsResult, SaleListing } from "@/utils/listings.types";
import { prepareListings, type ListingFilter } from "@/utils/listings/prepareListings";
import { pricePerSqft } from "@/utils/listings/listingFilters";
import { scoreListing, annualNetYield, hoaMonthly } from "@/utils/listings/listingScore";

const money = (v: number | null) => (v == null ? "—" : `$${Math.round(v).toLocaleString()}`);
const percent = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(2)}%`);

export default function TestListingsModal({ onClose }: { onClose: () => void }) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GetListingsResult | null>(null);
  const [minPpsf, setMinPpsf] = useState("");
  const [maxPpsf, setMaxPpsf] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim() || !state.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Call the server action directly — small caps keep testing frugal.
      const data = await getListings(city.trim(), state.trim(), 2000, 1500);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Client-side $/sqft band (no refetch), expressed as a pipeline filter.
  const min = minPpsf ? Number(minPpsf) : null;
  const max = maxPpsf ? Number(maxPpsf) : null;
  const ppsfFilter: ListingFilter<SaleListing> = (l) => {
    const p = pricePerSqft(l);
    if (min != null && (p == null || p < min)) return false;
    if (max != null && (p == null || p > max)) return false;
    return true;
  };

  // Filter + rank by HOA-adjusted yield in one pass (best first).
  const ranked = prepareListings(result?.listings ?? [], [ppsfFilter], scoreListing, true);
  const hidden = (result?.listings.length ?? 0) - ranked.length;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[85vh] w-full max-w-[480px] flex-col gap-6 overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Test Listings</h2>
            <p className="mt-1 text-sm text-gray-500">Query the RentCast cache by city.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 rounded-full text-gray-400 hover:text-gray-900"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Austin)"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="ST"
              className="w-20 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-center text-sm uppercase text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <p className="text-xs text-gray-400">Case-sensitive — e.g. “Palo Alto”, “CA”.</p>
          <button
            type="submit"
            disabled={loading || !city.trim() || !state.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Fetch listings
              </>
            )}
          </button>
        </form>

        {/* Filters (client-side, no refetch) */}
        {result && (
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
            <span className="text-gray-300">–</span>
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
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {result && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {ranked.length} listing{ranked.length === 1 ? "" : "s"}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  result.complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {result.complete ? "complete" : "capped — more available"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {result.rentalCount.toLocaleString()} of {result.rentalTotal.toLocaleString()} rental
              comps cached — the basis for the rent estimates
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="-mx-2 flex flex-1 flex-col gap-2 overflow-y-auto px-2">
            {ranked.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                {result.listings.length === 0
                  ? "No listings returned. Try a denser city or raise the limit."
                  : "Every listing was filtered out. Loosen the $/sqft range."}
              </p>
            )}
            {ranked.map((l: SaleListing) => (
              <div
                key={l.id}
                className="rounded-2xl border border-white/50 bg-white/40 p-4 transition hover:bg-white/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{l.address ?? "—"}</p>
                    <p className="text-xs capitalize text-gray-500">{l.propertyType ?? "property"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-gray-900">{money(l.price)}</p>
                    <p className="text-xs font-semibold text-emerald-700">
                      {percent(annualNetYield(l))} yield
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
      </Card>
    </div>
  );
}