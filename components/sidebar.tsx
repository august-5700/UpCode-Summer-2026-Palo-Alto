"use client";

import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RegionalOverview from "./regional-overview";
import RegionalDetails from "./regional-details";
import { GetListingsResult, SaleListing } from "@/utils/listings.types";
import ListingsViewer from "./listings-viewer";
import { TractData } from "@/utils/types";

interface SidebarProps {
  title?: string;
  regionalData?: TractData;
  listingData?: GetListingsResult
  onClose: () => void;
  onListingSelect?: (listing: SaleListing) => void;
}

export default function Sidebar({ title, regionalData, listingData, onClose, onListingSelect }: SidebarProps) {
  return (
    <Card className="absolute right-4 top-4 bottom-4 z-100 flex w-80 flex-col gap-6 overflow-y-auto rounded-3xl border border-white/40 bg-white/50 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title ?? 'Property Listings'}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-1 rounded-full text-gray-400 hover:text-gray-900"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      {regionalData && !listingData && (
        <>
          <RegionalOverview data={regionalData}/>

          <hr className="border-gray-100" />

          <RegionalDetails data={regionalData} />
        </>
      )}

      {listingData && regionalData && onListingSelect && (
      <>
        <RegionalOverview data={regionalData}/>
        <ListingsViewer data={listingData} onListingSelect={onListingSelect} />
      </>
      )}


    </Card>
  );
}
