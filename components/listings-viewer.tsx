'use client';

import type { SaleListing } from '@/utils/listings.types';
import { PropertyListing } from './property-listing';

interface ListingsViewerProps {
	title: string;
	listings: SaleListing[];
	meta?: { complete?: boolean; rentalCount?: number; rentalTotal?: number };
	onListingSelect: (listing: SaleListing) => void;
	onCompareListing: (l: SaleListing) => void;
	onRemoveListing: (l: SaleListing) => void;
}

// Controlled: renders exactly the listings it's given. Removing a listing bubbles
// up to the sidebar state so nothing goes stale between different areas/searches.
export default function ListingsViewer({
	title,
	listings,
	meta,
	onListingSelect,
	onCompareListing,
	onRemoveListing,
}: ListingsViewerProps) {
	return (
		<div className="w-full h-full">
			{/* Status */}
			{meta && meta.rentalCount && meta.rentalTotal && meta.complete && (
				<div className="flex flex-col gap-1.5">
					<p>Showing property listings in {title ?? 'someplace'}</p>
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
							{listings.length} listing{listings.length === 1 ? '' : 's'}
						</p>
					</div>
					<p className="text-xs text-gray-400">
						{meta.rentalCount.toLocaleString()} of {meta.rentalTotal.toLocaleString()}{' '}
						rental comps used for estimation
					</p>
				</div>
			)}

			{/* Results */}
			<div className="w-full h-[calc(90%)] -mx-2 grid grid-cols-1 gap-2 overflow-y-scroll px-2">
				{listings.length === 0 && (
					<p className="py-8 text-center text-sm text-gray-400">
						No listings returned. Try a denser city or raise the limit.
					</p>
				)}
				{listings.map((l: SaleListing) => (
					<PropertyListing
						key={l.id}
						l={l}
						title={title}
						ranked={listings}
						onListingSelect={onListingSelect}
						onCompareListing={onCompareListing}
						onRemoveListing={onRemoveListing}
					/>
				))}
			</div>
		</div>
	);
}
