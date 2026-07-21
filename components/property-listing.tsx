"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils";
import { getResultFromAddressAutocomplete } from "@/utils/api";
import { SaleListing } from "@/utils/listings.types";
import { pricePerSqft } from "@/utils/listings/listingFilters";
import { GeoData } from "@/utils/types";

import { ArrowRightLeft, DollarSign, Search as SearchIcon, X } from 'lucide-react';
import { useState } from "react";

const money = (v: number | null) => (v == null ? '—' : `$${Math.round(v).toLocaleString()}`);

const percent = (v: number | null) => (v == null ? '—' : `${(v * 100).toFixed(2)}%`);

// Monthly HOA fee from the raw RentCast payload (0 if none).
const hoaMonthly = (l: SaleListing): number => {
	const hoa = (l.raw as { hoa?: { fee?: number } } | null)?.hoa;
	return typeof hoa?.fee === 'number' ? hoa.fee : 0;
};

// Gross yield minus HOA: (estimatedRent - HOA) × 12 / price.
const netYield = (l: SaleListing): number | null => {
    if (l.price == null || l.price <= 0 || l.estimatedRent == null) return null;
    return ((l.estimatedRent - hoaMonthly(l)) * 12) / l.price;
};

interface PropertyListingProps {
        l: SaleListing;
        onListingSelect: (listing: SaleListing) => void;
        onCompareListing: (listing: SaleListing) => void;
        onRemoveListing: (listing: SaleListing) => void;
        ranked: SaleListing[]
        title: string

}



export function PropertyListing({l, onListingSelect, onCompareListing, onRemoveListing, ranked, title}: PropertyListingProps) {

    return (
        <div
            key={l.id}
            className={cn(
                'min-w-max rounded-2xl border p-3 text-sm transition-all duration-150 hover:cursor-pointer',
                l.selected
                    ? 'border-emerald-400 bg-emerald-100/40 hover:bg-emerald-100/50'
                    : 'border-white/50 bg-white/40 hover:bg-white/70',
            )}
            onClick={() => {
                onListingSelect(l);
                ranked.forEach((l: SaleListing) => (l.selected = false));
                l.selected = !l.selected;
            }}
        >
            <div className="flex relative items-start justify-between gap-3">
                <div className="min-w-0 w-50">
                    <p className="w-full truncate font-semibold text-gray-900">
                        {(l.address ?? '—').split(`, ${title}`)[0]}
                    </p>
                    <p className="text-xs capitalize text-gray-500">
                        {l.propertyType ?? 'property'}
                    </p>
                </div>
                <div className="absolute top-0 right-0 shrink-0 text-right">
                    <p className="font-bold text-gray-900">{money(l.price)}</p>
                    <p className="text-xs font-semibold text-emerald-700">
                        {percent(netYield(l))} yield
                    </p>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>Est. rent {money(l.estimatedRent)}/mo</span>

                <span>{l.squareFootage ? l.squareFootage.toLocaleString() + ' sq•ft' : 'sq•ft n/a'}</span>

            </div>
            {l.selected && (
                <div className="my-4 border-t border-gray-300">
                </div>
            )}
            {l.selected && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                    {hoaMonthly(l) > 0 && <span>HOA {money(hoaMonthly(l))}/mo</span>}
                    <span>
                        {l.bedrooms ?? '—'} bd · {l.bathrooms ?? '—'} ba
                    </span>
                    {pricePerSqft(l) != null && (
                        <span>{money(pricePerSqft(l))}/sqft</span>
                    )}
                    {l.daysOnMarket != null && (
                        <span>{l.daysOnMarket} days on market</span>
                    )}
                </div>
            )}
            {l.selected && (
                <div className="mt-3 grid grid-cols-6 text-xs text-gray-600 gap-x-3">
                    <button
                        className="flex col-span-3 items-center justify-center rounded-full py-1 px-2 gap-x-1 text-xs font-semibold text-white shadow-lg transition duration-300 bg-blue-600 hover:bg-blue-700"
                        onClick={()=>onCompareListing(l)}
                    >
                        <ArrowRightLeft className="h-3 w-3"/>
                        Compare
                    </button>
                    <button
                        // ZILLOW PLUGIN ONCLICK
                        className="flex col-span-2 items-center justify-center rounded-full py-1 px-2 gap-x-1 text-xs font-semibold text-white shadow-lg transition duration-300 bg-green-600 hover:bg-green-700"
                    >
                        <DollarSign className='h-3 w-3' />
                        Zillow
                    </button>
                    <button
                        onClick={()=>onRemoveListing(l)}
                        className="flex col-span-1 items-center justify-center rounded-full p-1 gap-x-1 text-xs font-semibold text-white shadow-lg transition duration-300 bg-red-600 hover:bg-red-700"
                    >
                        <X className='h-4 w-4' />
                    </button>
                </div>
            )}
        </div>
    )
}
