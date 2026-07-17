'use client';

import { useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getListings } from '@/utils/listings';
import type { GetListingsResult, SaleListing } from '@/utils/listings.types';
import { ListingFilter, prepareListings } from '@/utils/listings/prepareListings';
import { scoreListing } from '@/utils/listings/listingScore';
import { on } from 'node:cluster';
import { cn } from '@/lib/utils';
import { PropertyListing } from './property-listing';
import { DEFAULT_FILTERS } from '@/utils/listings/listingFilters';


const pricePerSqft = (l: SaleListing) =>
	l.price != null && l.squareFootage != null && l.squareFootage > 0
		? l.price / l.squareFootage
		: null;



interface ListingsViewerProps {
	onListingSelect: (listing: SaleListing) => void;
    onCompareListing: (l: SaleListing) => void;
	data: GetListingsResult;
    title: string;
}

export default function ListingsViewer({ onListingSelect, onCompareListing, data, title }: ListingsViewerProps) {
	const [minPpsf, setMinPpsf] = useState('');
	const [maxPpsf, setMaxPpsf] = useState('');

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
	const [ranked, setRanked] = useState<SaleListing[]>(prepareListings(data?.listings ?? [], [ppsfFilter].concat(DEFAULT_FILTERS), scoreListing, true));
	const hidden = (data?.listings.length ?? 0) - ranked.length;
	return (
		<div className='w-76'>
			{/* Filters (client-side, no refetch) */}
			{data && (
				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
						$/sqft
					</span>
					<input
						value={minPpsf}
						onChange={(e) => setMinPpsf(e.target.value.replace(/[^0-9.]/g, ''))}
						inputMode="decimal"
						placeholder="min"
						className="w-20 rounded-lg border border-gray-200 bg-white/70 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					/>
					<span className="text-gray-300">-</span>
					<input
						value={maxPpsf}
						onChange={(e) => setMaxPpsf(e.target.value.replace(/[^0-9.]/g, ''))}
						inputMode="decimal"
						placeholder="max"
						className="w-20 rounded-lg border border-gray-200 bg-white/70 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					/>
					{hidden > 0 && (
						<span className="ml-auto text-xs text-gray-400">{hidden} filtered out</span>
					)}
				</div>
			)}

			{/* Status */}
			{data && data.rentalCount && data.rentalTotal && data.complete && (
				<div className="flex flex-col gap-1.5">
                    <p>
                        Showing property listings in {title ?? 'someplace'}
                    </p>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							{ranked.length} listing{ranked.length === 1 ? '' : 's'}
						</p>
						{/* <span
							className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
								data.complete
									? 'bg-emerald-100 text-emerald-700'
									: 'bg-amber-100 text-amber-700'
							}`}
						>
							{data.complete ? 'complete' : 'capped — more available'}
						</span> */}
					</div>
					<p className="text-xs text-gray-400">
						{data.rentalCount.toLocaleString()} of {data.rentalTotal.toLocaleString()}{' '}
						rental comps used for estimation
					</p>
				</div>
			)}

			{/* Results */}
			{data && (
				<div className="w-max -mx-2 grid grid-cols-1 gap-2 overflow-y-auto px-2">
					{ranked.length === 0 && (
						<p className="py-8 text-center text-sm text-gray-400">
							{data.listings.length === 0
								? 'No listings returned. Try a denser city or raise the limit.'
								: 'Every listing was filtered out. Loosen the $/sqft range.'}
						</p>
					)}
					{ranked.map((l: SaleListing) => (
                        <PropertyListing l={l} onListingSelect={onListingSelect} onCompareListing={onCompareListing} onRemoveListing={(l: SaleListing) => setRanked(ranked.filter(i => i.id != l.id))} ranked={ranked} title={title} />
					))}
				</div>
			)}
		</div>
	);
}
