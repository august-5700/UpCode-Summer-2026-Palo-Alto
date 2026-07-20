"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";
import MapTooltip from "./map-tooltip";
import Comparison from "./comparison-selector";
import { getCounties, getBlockByCoords, getCountyByCoords, getCountyByCityState } from "@/utils/api";
import { Search } from "./search";
import { Filters } from "./filters";
import { LatLngTuple } from "leaflet";
import { LayersToggle } from "./layer-toggle";
import PropertyListingsSidebar from "./listings-viewer";
import { cn } from "@/lib/utils";
import { getListings, getListingsInArea } from "@/utils/listings";
import { GetListingsResult, SaleListing } from "@/utils/listings.types";
import { prepareWithDefaults } from "@/utils/listings/prepareListings";
import citySearch from "@/utils/citySearch";
import L from "leaflet";
import { renderMarkers } from "@/utils/renderMarkers";
import { MarkerType, TractData } from "@/utils/types";
import ComparisonSelectorToast from "./comparison-selector";
import LoadingToast from "./loading-toast";

type Hover = { block: any; x: number; y: number; countyName: string | null } | null;

const HOVER_DELAY = 1000; // ms of stillness before the tooltip shows
const MOVE_THRESHOLD = 10; // px, moves smaller than this count as still (ignores jitter)

type SidebarValue = null | 'block' | 'county' | 'listing' | 'comparison'

export default function MapView() {
    const [mapBounds, setMapBounds] = useState<L.LatLngBounds>(new L.LatLngBounds([0, 1], [0, -1]))
    const [regionalData, setRegionalData] = useState<TractData[] | null>(null)
    const [listingData, setListingData] = useState<GetListingsResult | null>(null)
    const [hover, setHover] = useState<Hover>(null);
    const [mapCenter, setMapCenter] = useState<{
        lat: number;
        lng: number;
        bbox: [number, number, number, number];
    }>();
    const [sidebarValue, setSidebarValue] = useState<SidebarValue>(null);
    const [sidebarTitle, setSidebarTitle] = useState<string>('');
    const [enableListingsButton, setEnableListingButton] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    // separate from `loading` (which Map also drives) so the toast only shows
    // while the listings request is actually in flight
    const [fetchingListings, setFetchingListings] = useState(false);
    // only known once citySearch resolves, so the toast starts generic
    const [listingsCity, setListingsCity] = useState<string | null>(null);
    const [markerPoints, setMarkerPoints] = useState<MarkerType[]>([]);
    const [comparisonSelectorActive, setComparisonSelectorActive] = useState<boolean>(false);
    const [showComparisonToast, setShowComparisonToast] = useState<boolean>(false);
    const comparisonSelectorActiveRef = useRef(comparisonSelectorActive);

    useEffect(() => {
        comparisonSelectorActiveRef.current = comparisonSelectorActive;
        console.log('comparison selector is ', comparisonSelectorActiveRef.current)
    }, [comparisonSelectorActive]);


    const [activeLayer, setActiveLayer] = useState<
        "default" | "heatmap" | "choropleth" | "none"
    >("default");

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const anchorRef = useRef<{ x: number; y: number } | null>(null);
    const latestRef = useRef<Hover>(null);
    const countyNamesRef = useRef<Record<string, string>>({}); // "state_fip-county_fip" -> name
    const ENABLE_LISTINGS_BUTTON_LEVEL = 8

    // load county names once so tract-level hovers can show the county name
    useEffect(() => {
        getCounties().then((counties: any[]) => {
        const lookup: Record<string, string> = {};
        for (const c of counties) lookup[`${c.state_fip}-${c.county_fip}`] = c.name;
        countyNamesRef.current = lookup;
        });
    }, []);
    
    const handleViewListingBtn = useCallback(async () => {
        setFetchingListings(true)
        setListingsCity(null)
        try {
        console.log('mapbounds', mapBounds)
        const cityRange = await citySearch([mapBounds.getSouth(), mapBounds.getWest()], [mapBounds.getNorth(), mapBounds.getEast()])
        setListingsCity(cityRange[0]?.[0]?.trim() ?? null)

        console.log("City Range", cityRange)
        function loadCitiesListings(){
            cityRange.forEach(async (location:[string, string]) => {
                console.log('location: ', location)
                const data = await getListings(location[0].trim(), location[1].trim(), 2000, 1000);
                const ranked = prepareWithDefaults(data.listings)
                console.log("city listings", ranked)
            })
            
        }
        loadCitiesListings()

        const listings = await getListingsInArea(mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth())
        handleSelect(mapBounds.getCenter().lat, mapBounds.getCenter().lng, 'county', false)

        // Filter + rank before building markers so pins match the listings pane.
        const ranked = prepareWithDefaults(listings)
        setListingData({listings: ranked})
        setSidebarValue('listing')
        setSidebarTitle(cityRange[0][0])
        setMarkerPoints(ranked.map((listing: SaleListing) => {
            return {
                lat: listing.latitude,
                lng: listing.longitude,
                address: listing.address,
                highlighted: false
            }
        }));
        } finally {
            setFetchingListings(false)
        }
    }, [mapBounds])

    const handleSelect = useCallback(async (lat: number, lng: number, level: "county" | "block" | "listing", set: boolean, listings?:SaleListing[]) => {
        console.log(comparisonSelectorActive)
        const data = await (async () => {
            switch (level) {
                case 'block':
                    return await getBlockByCoords(lat, lng);
                case 'county':
                    return await getCountyByCoords(lat, lng);
                default:
                    return null;
            }
        })();

        if (!data && level == 'listing' && listings) {
            // select a listing
        }


        if (data && !regionalData?.includes(data)) {
            if (comparisonSelectorActiveRef.current) {
                console.log('adding to comparison. regionalData will be: ', (regionalData: any) => [...(regionalData ?? []), data])
                setRegionalData(prev => [...(prev ?? []), data]);
                setComparisonSelectorActive(false);
            } else {
                console.log('replacing county. regionalData will be: ', data)
                setRegionalData([data]);
            }
        }
        
        if (set) {
            setSidebarValue(level);
            setSidebarTitle(data ? data.title : 'not found')
        }
    }, [comparisonSelectorActive]);


    const handleHover = useCallback((block: any | null, x: number, y: number) => {
        if (!block) {
        if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = null;
            anchorRef.current = null;
            latestRef.current = null;
            setHover(null);
            return;
        }

        // tract rows carry tract_code but no name, so resolve the county name for the title
        const countyName =
        block.tract_code != null
            ? countyNamesRef.current[`${block.state_fip}-${block.county_fip}`] ?? null
            : null;

        latestRef.current = { block, x, y, countyName };

        const a = anchorRef.current;
        const moved = !a || Math.hypot(x - a.x, y - a.y) > MOVE_THRESHOLD;
        if (!moved) return;

        anchorRef.current = { x, y };
        setHover(null);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setHover(latestRef.current), HOVER_DELAY);
    }, []);

    const handleListingSelect = useCallback((listing: SaleListing) => {
        console.log('listing selected', listing)
        setMarkerPoints(prev =>
            prev.map(marker => ({
                ...marker,
                highlighted: marker.address === listing.address
            }))
        );
    }, []);

    async function viewListings(item: string[]) {
        if (item.length !== 2) return;

        try {
        setLoading(true)
        setFetchingListings(true)
        setListingsCity(item[0]?.trim() ?? null)
        const listingData = await getListings(item[0], item[1], 2000, 1500);
        const regionalData = await getCountyByCityState(item)
        // Filter + rank before building markers so pins match the listings pane.
        const ranked = prepareWithDefaults(listingData.listings)
        setMarkerPoints(ranked.map((listing: SaleListing) => {
            return {
            lat: listing.latitude,
            lng: listing.longitude,
            address: listing.address,
            highlighted: false
            }
        }));
        setListingData({...listingData, listings: ranked});
        if (regionalData){
            setRegionalData([regionalData])
            setComparisonSelectorActive(false)
        }
        } catch (err) {
        console.log(err instanceof Error ? err.message : "Something went wrong");
        } finally {
        setLoading(false)
        setFetchingListings(false)
        }
    }

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);


    return (
        <>
            <LoadingToast
                show={fetchingListings}
                message={listingsCity ? `Fetching listings in ${listingsCity}` : undefined}
            />
            {showComparisonToast && (
                <ComparisonSelectorToast item={sidebarValue ?? 'item'} onFinished={()=>setShowComparisonToast(false)}/>
            )}
            <Map 
                onSelectCoords={(lat, lng, level) => handleSelect(lat, lng, level, true)}
                onHover={handleHover} 
                onZoomChange={(zoom: number) => {
                    setEnableListingButton(zoom > ENABLE_LISTINGS_BUTTON_LEVEL ? true : false)
                }}
                setLoading={setLoading}
                center={mapCenter}
                activeLayer={activeLayer}
                setMapBounds = {setMapBounds}
                markerPoints={markerPoints}
            />
            <Sidebar
                title={sidebarTitle}
                regionalData={regionalData}
                listingData={listingData}
                onClose={() => {setRegionalData(null);setSidebarValue(null);setSidebarTitle('')}}
                onListingSelect={(listing: SaleListing) => handleListingSelect(listing)}
                comparisonSelectorActive={comparisonSelectorActive}
                setComparisonSelectorActive={(value: boolean) => {
                    setComparisonSelectorActive(value);
                    if (value) {
                        setShowComparisonToast(true);
                    }
                }}
                onRemoveRegion={(region: TractData) =>
                    setRegionalData(prev =>
                        prev ? prev.filter(r => r !== region) : null
                    )
                }
            />

            
            {hover && <MapTooltip block={hover.block} x={hover.x} y={hover.y} countyName={hover.countyName} />}
            <Search 
                handleSubmit={(lat, lng, bbox, item) => {
                    setMapCenter({lat: lat, lng: lng, bbox: bbox})
                    console.log('viewing listings')
                    setSidebarValue('listing')
                    setSidebarTitle(item[0])
                    viewListings(item)
                }}
            />
            {/* <Filters /> */}
            <LayersToggle
                value={activeLayer}
                onValueChange={(value:string)=>{
                if (value == 'default' || value == 'heatmap' || value == 'choropleth' || value == 'none'){
                    setActiveLayer(value);
                } else {
                    setActiveLayer('default')
                }
                console.log('value', value)
                }}
            />
            <button
                onClick={() => {if (enableListingsButton){console.log('button');handleViewListingBtn()}}}
                // onClick={() => {setSidebarValue('listings')}} // always enabled for testing purposes. uncomment above line when done
                className={cn("absolute right-4 bottom-4 z-100 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg  transition duration-300"
                ,enableListingsButton ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500' )}
            >
                View Listings
            </button>
        </>
    );
}