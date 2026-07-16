'use client';

import { ArrowRightLeft, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RegionalOverview from './regional-overview';
import RegionalDetails from './regional-details';
import { GetListingsResult, SaleListing } from '@/utils/listings.types';
import ListingsViewer from './listings-viewer';
import { TractData } from '@/utils/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import ComparisonSelector from './comparison-selector';

interface SidebarProps {
	title?: string;
	regionalData: TractData[] | null;
	listingData?: GetListingsResult;
	onClose: () => void;
	onListingSelect?: (listing: SaleListing) => void;
}

export default function Sidebar({
	title,
	regionalData,
	listingData,
	onClose,
	onListingSelect,
}: SidebarProps) {
	const [comparisonSelectorActive, setComparisonSelectorActive] = useState<boolean>(false);

	// 1. Calculate raw width values based on active slots/panels
	const baseMultiplier = regionalData
		? regionalData.length + (comparisonSelectorActive ? 1 : 0)
		: 0;
	const dynamicWidth = baseMultiplier > 0 ? `${baseMultiplier * 20}rem` : undefined;

	// Determine width fraction based on total active slots/panels
	const widthClass = baseMultiplier > 1 ? `w-1/${baseMultiplier}` : 'w-full';

	return (
        <motion.div
            layout
            initial={{ opacity:0, x:"var(--entry-distance-x)" }} 
            animate={{ opacity:1, x:"0" }}
            exit={{ opacity:0, x:"var(--entry-distance-x)" }}
            transition = {{ duration:0.3 }}
            className='absolute right-4 top-4 bottom-4 z-100 [--entry-distance-x:20px] md:[--entry-distance-x:50px]'
            style={dynamicWidth ? { width: dynamicWidth } : undefined}
        >
            <Card
                className={`min-h-full w-full flex flex-col gap-6 rounded-3xl border border-white/40 bg-white/50 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 ${!regionalData ? 'w-80' : ''}`}
                
            >
                {/* Dynamic Header */}
                <div className="flex items-start justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                        {title ?? 'Property Listings'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-gray-400 hover:text-gray-900"
                            onClick={() => setComparisonSelectorActive((prev) => !prev)}
                        >
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-gray-400 hover:text-gray-900"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Panels Layout Container */}
                <div className="flex flex-row h-full min-h-0 gap-6 overflow-x-auto">
                    {/* Slot 1: Comparison Selector (If Active) */}
                    {comparisonSelectorActive && (
                        <div className={`${widthClass} h-full min-h-0 overflow-y-auto`}>
                            <ComparisonSelector item="county" />
                        </div>
                    )}

                    {/* Dynamic Slots for Regions (Overview & Details Layout) */}
                    {regionalData &&
                        !listingData &&
                        regionalData.map((region: TractData, index: number) => (
                            <div
                                key={region.title || `region-overview-${index}`}
                                className={`${widthClass} space-y-4 h-full min-h-0 overflow-y-auto pr-2`}
                            >
                                {regionalData.length > 1 && (
                                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">
                                        {region.title || `Region ${index + 1}`}
                                    </h3>
                                )}
                                <RegionalOverview data={region} />
                                <hr className="border-gray-200" />
                                <RegionalDetails data={region} />
                            </div>
                        ))}

                    {/* Dynamic Slots for Regions with Listing Viewer Layout */}
                    {listingData &&
                        regionalData &&
                        onListingSelect &&
                        regionalData.map((region: TractData, index: number) => (
                            <div
                                key={region.title || `region-listings-${index}`}
                                className={`${widthClass} space-y-4 h-full min-h-0 overflow-y-auto pr-2`}
                            >
                                {regionalData.length > 1 && (
                                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">
                                        {region.title || `Region ${index + 1}`}
                                    </h3>
                                )}
                                <RegionalOverview data={region} />
                                {/* The listings component sits below the respective regional overview map panel */}
                                <ListingsViewer data={listingData} onListingSelect={onListingSelect} />
                            </div>
                        ))}
                </div>
            </Card>
        </motion.div>
	);
}
