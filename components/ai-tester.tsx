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
import { testAI } from "@/utils/aiTester";

export default function AITester() {
  const [data, setData] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [minPpsf, setMinPpsf] = useState("");
  const [maxPpsf, setMaxPpsf] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    console.log('submit')
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Call the server action directly — small caps keep testing frugal.
      const data = await testAI()
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
    >
      <Card
        className="flex max-h-[85vh] w-full max-w-[480px] flex-col gap-6 overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Test AI</h2>
            <p className="mt-1 text-sm text-gray-500">Get repsonses from openai</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 rounded-full text-gray-400 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            {/* <input
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="City (e.g. Austin)"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            /> */}
            {/* <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="ST"
              className="w-20 rounded-xl border border-gray-200 bg-white/70 px-4 py-2.5 text-center text-sm uppercase text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            /> */}
          </div>
          <p className="text-xs text-gray-400">Case-sensitive — e.g. “Palo Alto”, “CA”.</p>
          <button
            type="submit"
            disabled={loading}
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

        {/* Status */}
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {result && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">

            </div>
            <p className="text-xs text-black">
                {result}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}