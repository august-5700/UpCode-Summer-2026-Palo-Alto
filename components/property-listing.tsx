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
import { zillowUrl } from "@/utils/zillow";

import { ArrowRightLeft, DollarSign, Search as SearchIcon, X } from 'lucide-react';
import { useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './ui/popover';
import { CircleQuestionMark} from 'lucide-react'

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
    console.count("propl render");
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
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="underline decoration-blue-500">Est. rent {money(l.estimatedRent)}/mo</span>
                    </TooltipTrigger>
                    <TooltipContent side='left' className = "bg-white/50 text-gray-800 ml-10 backdrop-blur-2xl backdrop-saturate-150 z-500">
                        <Popover>
                            <PopoverTrigger>
                                <CircleQuestionMark scale='0.1' />
                            </PopoverTrigger>
                            <PopoverContent side='bottom' className='mt-3 bg-white/50 backdrop-blur-2xl backdrop-saturate-150 text-gray-700'>
                                <PopoverHeader>
                                    <PopoverTitle>Estimated Rent Of The Selected Property</PopoverTitle>
                                    <PopoverDescription>
                                        The rent of the property is estimated based on similar surrounding listings. 
                                        Due to estimations being based on listed properties instead off currently rented out listings the shown rent will be 10-15% higher than what is shown on Zillow
                                    </PopoverDescription>
                                </PopoverHeader>
                            </PopoverContent>
                        </Popover>
                    </TooltipContent>
                </Tooltip>
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
                <div className="mt-3 grid grid-cols-7 text-xs text-gray-600 gap-x-3">
                    <button
                        className="flex col-span-3 items-center justify-center rounded-full py-1 px-2 gap-x-1 text-xs font-semibold text-white shadow-lg transition duration-300 bg-blue-600 hover:bg-blue-700"
                        onClick={()=>onCompareListing(l)}
                    >
                        <ArrowRightLeft className="h-3 w-3"/>
                        Compare
                    </button>
                    <div className='col-span-1'/>
                    <a
                        href={zillowUrl(l.address) ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-disabled={!l.address}
                        className={cn(
                            "flex col-span-3 items-center justify-center rounded-full py-1 px-2 gap-x-1 text-xs font-semibold text-white shadow-lg transition duration-300",
                            l.address
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-gray-400 cursor-not-allowed pointer-events-none"
                        )}
                    >
                        <DollarSign className='h-3 w-3' />
                        Zillow
                    </a>
                </div>
            )}
        </div>
    )
}
