'use client';

import type { GetListingsResult, SaleListing } from '@/utils/listings.types';
import { PropertyListing } from './property-listing';

interface ListingsViewerProps {
	onListingSelect: (listing: SaleListing) => void;
    onCompareListing: (l: SaleListing) => void;
	data: GetListingsResult;
	title: string;
}

export default function ListingsViewer({ onListingSelect, data, title }: ListingsViewerProps) {
	const ranked = data?.listings ?? [];

	return (
		<div className='w-76'>
			{/* Status */}
			{data && data.rentalCount && data.rentalTotal && data.complete && (
				<div className="flex flex-col gap-1.5">
					<p>Showing property listings in {title ?? 'someplace'}</p>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							{ranked.length} listing{ranked.length === 1 ? '' : 's'}
						</p>
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
							No listings returned. Try a denser city or raise the limit.
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