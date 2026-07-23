'use client';

import { ArrowRightLeft, CircleQuestionMark, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RegionalOverview from './regional-overview';
import RegionalDetails from './regional-details';
import ListingsViewer from './listings-viewer';
import { SaleListing } from '@/utils/listings.types';
import { SidebarContent, TractData } from '@/utils/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './ui/popover';

interface SidebarProps {
    content: SidebarContent;
    onClose: () => void;
    /** Begin comparing more of whatever type is currently shown. */
    onStartCompare: () => void;
    /** Begin a listing-vs-listing comparison, seeded with this listing. */
    onStartListingCompare: (l: SaleListing) => void;
    /** Remove one comparison column (region or listing) by index. */
    onRemoveSet: (index: number) => void;
    /** Remove a listing from the browsable list. */
    onRemoveListing: (l: SaleListing) => void;
    onListingSelect: (l: SaleListing) => void;
    onHomeInfo: (l: SaleListing) => void;
}

// Single-set widths are sized to comfortably fit that level's content.
// Comparison uses a FIXED width (~1.5x the single width) regardless of how many
// columns are added — extra columns scroll horizontally instead of widening it.
const SINGLE_WIDTH: Record<'block' | 'county' | 'listing', string> = {
    block: 'w-88',
    county: 'w-88',
    listing: 'w-96',
};
const COMPARE_WIDTH: Record<'block' | 'county' | 'listing', string> = {
    block: 'w-[42rem]',
    county: 'w-[48rem]',
    listing: 'w-[37rem]',
};

const money = (v: number | null | undefined) =>
    v == null ? '—' : `$${Math.round(v).toLocaleString()}`;
const percent = (v: number | null | undefined) =>
    v == null ? '—' : `${(v * 100).toFixed(2)}%`;

export default function Sidebar({
    content,
    onClose,
    onStartCompare,
    onStartListingCompare,
    onRemoveSet,
    onRemoveListing,
    onListingSelect,
    onHomeInfo,
}: SidebarProps) {
    const level = content.level;

    const isComparing =
        content.level === 'listing'
            ? content.comparing.length >= 2
            : content.level === 'county' || content.level === 'block'
              ? content.regions.length > 1
              : false;

    const widthClass =
        level == null ? 'w-88' : isComparing ? COMPARE_WIDTH[level] : SINGLE_WIDTH[level];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 'var(--entry-distance-x)' }}
            animate={{ opacity: 1, x: '0' }}
            exit={{ opacity: 0, x: 'var(--entry-distance-x)' }}
            transition={{ duration: 0.3 }}
            className={cn(
                'overflow-x-auto rounded-3xl absolute right-4 top-4 z-100 [--entry-distance-x:20px] md:[--entry-distance-x:50px]',
                widthClass
            )}
        >
            <Card className={cn("w-full flex flex-col rounded-3xl border border-white/40 bg-white/50 p-6 shadow-2xl backdrop-blur-2xl backdrop-saturate-150",
                level == null ? "h-24" : 
                isComparing ? "max-h-[calc(100vh-30px)]": 
                "h-[calc(100vh-30px)]"
            )}>
                {level == null && (
                    <p className="text-sm italic text-gray-500">
                        Select properties, counties, or blocks to view them here in the sidebar
                    </p>
                )}

                {(content.level === 'county' || content.level === 'block') &&
                    (isComparing ? (
                        <RegionComparison
                            regions={content.regions}
                            onAdd={onStartCompare}
                            onClose={onClose}
                            onRemoveSet={onRemoveSet}
                        />
                    ) : (
                        <RegionSingle
                            region={content.regions[0]}
                            onCompare={onStartCompare}
                            onClose={onClose}
                        />
                    ))}

                {content.level === 'listing' &&
                    (isComparing ? (
                        <ListingComparison
                            title={content.title}
                            listings={content.comparing}
                            onAdd={onStartCompare}
                            onClose={onClose}
                            onRemoveSet={onRemoveSet}
                        />
                    ) : (
                        <ListingBrowse
                            title={content.title}
                            region={content.region}
                            listings={content.listings}
                            meta={content.meta}
                            onClose={onClose}
                            onListingSelect={onListingSelect}
                            onStartListingCompare={onStartListingCompare}
                            onRemoveListing={onRemoveListing}
                            onHomeInfo={onHomeInfo}
                        />
                    ))}
            </Card>
        </motion.div>
    );
}

/* ── Single region (county / block) ─────────────────────────────────────────── */
function RegionSingle({
    region,
    onCompare,
    onClose,
}: {
    region: TractData;
    onCompare: () => void;
    onClose: () => void;
}) {
    return (
        <div className="space-y-4 w-full ">
            <div className="flex items-start justify-between w-full">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    {region.title}
                </h2>
                <div className="flex items-center gap-2 pl-4">
                    <Tooltip>
                        <TooltipTrigger>
                            <IconButton onClick={onCompare} label="Compare">
                                <ArrowRightLeft className="h-5 w-5" />
                            </IconButton>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-gray-800 z-500 bg-white/50 backdrop-blur-2xl backdrop-saturate-150">
                            <Popover>
                                <PopoverTrigger>
                                    <CircleQuestionMark scale='0.1'/>
                                </PopoverTrigger>
                                <PopoverContent side="bottom" className='z-500 mt-3 bg-white/50 backdrop-blur-2xl backdrop-saturate-150 text-gray-700'>
                                    <PopoverHeader>
                                        <PopoverTitle>Compare Locations</PopoverTitle>
                                        <PopoverDescription className="text-xs">Select areas you are interested in to compare metrics and data  </PopoverDescription>
                                    </PopoverHeader>
                                </PopoverContent>
                            </Popover>
                            <p>Comparison</p>
                        </TooltipContent>
                    </Tooltip>
                    <IconButton onClick={onClose} label="Close">
                        <X className="h-5 w-5" />
                    </IconButton>
                </div>
            </div>
            <RegionalOverview data={region} />
            <RegionalDetails data={region} />
        </div>
    );
}

/* ── Region comparison (many counties / blocks side by side) ─────────────────── */
function RegionComparison({
    regions,
    onAdd,
    onClose,
    onRemoveSet,
}: {
    regions: TractData[];
    onAdd: () => void;
    onClose: () => void;
    onRemoveSet: (index: number) => void;
}) {
    return (
        <>
            <ComparisonHeader onAdd={onAdd} onClose={onClose} />
            <div className="flex flex-row h-full w-full min-h-0 min-w-0 overflow-x-auto space-x-12">
                {regions.map((region, index) => (
                    <div
                        key={`${region.title}-${index}`}
                        className="space-y-4 h-full min-h-0 w-70 shrink-0 overflow-y-auto overflow-x-clip"
                    >
                        <div className="flex items-start justify-between w-70">
                            {/* Each column shows its own region's title — not a shared one. */}
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                {region.title}
                            </h2>
                            <IconButton onClick={() => onRemoveSet(index)} label="Remove">
                                <X className="h-5 w-5" />
                            </IconButton>
                        </div>
                        <RegionalOverview data={region} />
                        <RegionalDetails data={region} />
                    </div>
                ))}
            </div>
        </>
    );
}

/* ── Listing browse (one area's listings) ────────────────────────────────────── */
function ListingBrowse({
    title,
    region,
    listings,
    meta,
    onClose,
    onListingSelect,
    onStartListingCompare,
    onRemoveListing,
    onHomeInfo,
}: {
    title: string;
    region: TractData | null;
    listings: SaleListing[];
    meta?: { complete?: boolean; rentalCount?: number; rentalTotal?: number };
    onClose: () => void;
    onListingSelect: (l: SaleListing) => void;
    onStartListingCompare: (l: SaleListing) => void;
    onRemoveListing: (l: SaleListing) => void;
    onHomeInfo: (l: SaleListing) => void;
}) {
    return (
        <div className="space-y-4 w-full h-full">
            <div className="flex items-start justify-between w-full">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
                <IconButton onClick={onClose} label="Close">
                    <X className="h-5 w-5" />
                </IconButton>
            </div>
            {region && <RegionalOverview data={region} />}
            <ListingsViewer
                title={title}
                listings={listings}
                meta={meta}
                onListingSelect={onListingSelect}
                onCompareListing={onStartListingCompare}
                onRemoveListing={onRemoveListing}
                onHomeInfo={onHomeInfo}
            />
        </div>
    );
}

/* ── Listing comparison (each listing its own column, no region view) ────────── */
function ListingComparison({
    title,
    listings,
    onAdd,
    onClose,
    onRemoveSet,
}: {
    title: string;
    listings: SaleListing[];
    onAdd: () => void;
    onClose: () => void;
    onRemoveSet: (index: number) => void;
}) {
    return (
        <>
            <ComparisonHeader onAdd={onAdd} onClose={onClose} />
            <div className="flex flex-row h-full w-full min-h-0 min-w-0 overflow-x-auto space-x-6">
                {listings.map((l, index) => (
                    <CompareListingCard
                        key={l.id}
                        l={l}
                        title={title}
                        onRemove={() => onRemoveSet(index)}
                    />
                ))}
            </div>
        </>
    );
}

function CompareListingCard({
    l,
    title,
    onRemove,
}: {
    l: SaleListing;
    title: string;
    onRemove: () => void;
}) {
    const shortAddr = (l.address ?? '—').split(`, ${title}`)[0];
    return (
        <div className="w-64 shrink-0 space-y-2 rounded-2xl border border-white/50 bg-white/40 p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900">{shortAddr}</p>
                <IconButton onClick={onRemove} label="Remove">
                    <X className="h-4 w-4" />
                </IconButton>
            </div>
            <p className="text-xs capitalize text-gray-500">{l.propertyType ?? 'property'}</p>
            <p className="text-3xl font-bold leading-none text-gray-900">{money(l.price)}</p>
            <p className="text-sm font-semibold text-emerald-700">
                {percent(l.annualRentToPrice)} yield
            </p>
            <div className="mt-1 flex flex-col gap-1 text-xs text-gray-600">
                <span>Est. rent {money(l.estimatedRent)}/mo</span>
                <span>
                    {l.bedrooms ?? '—'} bd · {l.bathrooms ?? '—'} ba
                </span>
                <span>
                    {l.squareFootage ? l.squareFootage.toLocaleString() + ' sq·ft' : 'sq·ft n/a'}
                </span>
                {l.daysOnMarket != null && <span>{l.daysOnMarket} days on market</span>}
            </div>
        </div>
    );
}

/* ── Shared bits ─────────────────────────────────────────────────────────────── */
function ComparisonHeader({ onAdd, onClose }: { onAdd: () => void; onClose: () => void }) {
    return (
        <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 underline">Comparison</h2>
            <div className="flex items-center gap-2">
                <IconButton onClick={onAdd} label="Add">
                    <Plus className="h-5 w-5" />
                </IconButton>
                <IconButton onClick={onClose} label="Close">
                    <X className="h-5 w-5" />
                </IconButton>
            </div>
        </div>
    );
}

function IconButton({
    onClick,
    label,
    children,
}: {
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className="rounded-full text-gray-400 hover:text-gray-900"
            onClick={onClick}
        >
            {children}
        </Button>
    );
}
