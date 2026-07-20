'use client';

import { ArrowRightLeft, CircleQuestionMark, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RegionalOverview from './regional-overview';
import RegionalDetails from './regional-details';
import { GetListingsResult, SaleListing } from '@/utils/listings.types';
import ListingsViewer from './listings-viewer';
import { TractData } from '@/utils/types';
import { Dispatch, SetStateAction, useState } from 'react';
import { motion } from 'framer-motion';
import ComparisonSelector from './comparison-selector';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from './ui/popover';

interface SidebarProps {
    title: string;
	regionalData: TractData[] | null;
	listingData: GetListingsResult | null;
	onClose: () => void;
	onListingSelect?: (listing: SaleListing) => void;
    comparisonSelectorActive: boolean;
    setComparisonSelectorActive: (value: boolean) => void;
    onRemoveRegion: (item: TractData) => void;
}

export default function Sidebar({
    title,
	regionalData,
	listingData,
	onClose,
	onListingSelect,
    comparisonSelectorActive,
    setComparisonSelectorActive,
    onRemoveRegion
}: SidebarProps) {

	// 1. Calculate raw width values based on active slots/panels
	const baseMultiplier = regionalData
		? regionalData.length 
		: 0;

    const listingsComparedData = listingData?.listings.filter((l: SaleListing) => l.compared) ?? []
    

	return (
        <motion.div
            layout
            initial={{ opacity:0, x:"var(--entry-distance-x)" }} 
            animate={{ opacity:1, x:"0" }}
            exit={{ opacity:0, x:"var(--entry-distance-x)" }}
            transition = {{ duration:0.3 }}
            className={cn('overflow-x-auto absolute right-4 top-4 z-100 [--entry-distance-x:20px] md:[--entry-distance-x:50px]',
                baseMultiplier > 1 ? 'w-lg' : 'w-88'
            )}
        >
            <Card
                className='min-h-full max-h-187.5 w-full flex flex-col rounded-3xl border border-white/40 bg-white/50 p-6 shadow-2xl backdrop-blur-2xl backdrop-saturate-150'
                
            >
                {/* Dynamic Header */}
                {baseMultiplier > 1 && (
                    <div className="flex items-start justify-between">
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                            Comparison
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-gray-400 hover:text-gray-900"
                                onClick={() => {setComparisonSelectorActive(true)}}
                            >
                                {regionalData && (
                                    regionalData.length > 1 ? (
                                        <Plus className="h-5 w-5" />
                                    ) : (
                                        <ArrowRightLeft className="h-5 w-5" />
                                    )
                                )}
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
                )}

                {/* Panels Layout Container */}
                <div className="flex flex-row h-full w-full min-h-0 min-w-0 overflow-x-auto space-x-12">
                    {/* Dynamic Slots for Regions with Listing Viewer Layout */}
                    {regionalData && !(listingsComparedData.length > 0) &&
                        regionalData.map((region: TractData, index: number) => (
                            <div
                                key={title || `region-${index}`}
                                className={`space-y-4 h-full min-h-0 w-max shrink-0 overflow-y-auto overflow-x-clip`}
                            >
                                <div className="flex items-start justify-between">
                                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                        {title}
                                    </h2>
                                    {baseMultiplier > 1 ? (
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full text-gray-400 hover:text-gray-900"
                                                onClick={()=>onRemoveRegion(region)}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 pl-4">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full text-gray-400 hover:text-gray-900"
                                                        onClick={() => {setComparisonSelectorActive(true)}}
                                                    >
                                                        <ArrowRightLeft className="h-5 w-5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="z-500 bg-white text-gray-800">
                                                    <Popover>
                                                        <PopoverTrigger>
                                                            <CircleQuestionMark scale='0.1'/>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="z-500">
                                                            <PopoverHeader>
                                                                <PopoverTitle>Compare Counties And Listings</PopoverTitle>
                                                                <PopoverDescription>Select areas you are interested in to compare metrics</PopoverDescription>
                                                            </PopoverHeader>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <p>Comparison View</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full text-gray-400 hover:text-gray-900"
                                                onClick={onClose}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <RegionalOverview data={region} />
                                {listingData && onListingSelect && (
                                    <ListingsViewer 
                                        title={title} 
                                        data={listingData} 
                                        onListingSelect={onListingSelect} 
                                        onCompareListing={
                                            (l: SaleListing) => {
                                                l.compared = false
                                                setComparisonSelectorActive(true)
                                            }
                                        }
                                    />
                                )}
                                {!listingData && (
                                    <RegionalDetails data={region} />
                                )}

                            </div>
                        ))}
                    {listingsComparedData.length > 0 && (
                        <div>{listingsComparedData[0].address ?? ''}</div>
                    )}
                </div>
            </Card>
        </motion.div>
	);
}
