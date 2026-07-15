"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";
import MapTooltip from "./map-tooltip";
import Comparison from "./comparison";
import {getCounties, getBlockByCoords, getCountyByCoords, getCountyByCityState } from "@/utils/api";
import { Search } from "./search";
import { Filters } from "./filters";
import { LatLngTuple } from "leaflet";
import { LayersToggle } from "./layer-toggle";
import PropertyListingsSidebar from "./listings-viewer";
import { cn } from "@/lib/utils";
import { getListings, getListingsInArea } from "@/utils/listings";
import { GetListingsResult, SaleListing } from "@/utils/listings.types";
import citySearch from "@/utils/citySearch";
import L from "leaflet";
import { renderMarkers } from "@/utils/renderMarkers";
import { MarkerType, TractData } from "@/utils/types";

type Hover = { block: any; x: number; y: number; countyName: string | null } | null;

const HOVER_DELAY = 1000; // ms of stillness before the tooltip shows
const MOVE_THRESHOLD = 10; // px, moves smaller than this count as still (ignores jitter)

type SidebarValue = null | 'block' | 'county' | 'listings' | 'comparison'

export default function MapView() {
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds>(new L.LatLngBounds([0, 1], [0, -1]))
  const [regionalData, setRegionalData] = useState<TractData | null>(null)
  const [listingData, setListingData] = useState<GetListingsResult | null>(null)
  const [hover, setHover] = useState<Hover>(null);
  const [mapCenter, setMapCenter] = useState<{
      lat: number;
      lng: number;
      bbox: [number, number, number, number];
  }>();
  const [sidebarValue, setSidebarValue] = useState<SidebarValue>(null);
  const [enableListingsButton, setEnableListingButton] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [markerPoints, setMarkerPoints] = useState<MarkerType[]>([]);


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
        console.log('mapbounds', mapBounds)
        const cityRange = await citySearch([mapBounds.getSouth(), mapBounds.getWest()], [mapBounds.getNorth(), mapBounds.getEast()])

        console.log("City Range", cityRange)
        function loadCitiesListings(){
            cityRange.forEach(async (location:[string, string]) => {
                console.log('location: ', location)
                const data = await getListings(location[0].trim(), location[1].trim(), 2000, 1500);
                console.log("city listings", data)
            })
            
        }
        loadCitiesListings()

        const listings = await getListingsInArea(mapBounds.getWest(), mapBounds.getSouth(), mapBounds.getEast(), mapBounds.getNorth())
        setListingData({listings})
        setMarkerPoints(listings.map((listing: SaleListing) => {
            return {
                lat: listing.latitude,
                lng: listing.longitude,
                address: listing.address,
                highlighted: false
            }
        }));
  }, [mapBounds])

  const handleSelect = useCallback(async (lat: number, lng: number, level: "county" | "block") => {
    const data = level === "block" ? await getBlockByCoords(lat, lng) : await getCountyByCoords(lat, lng);
    setRegionalData(data);
    setSidebarValue('block')
  }, []);

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
      const listingData = await getListings(item[0], item[1], 2000, 1500);
      const regionalData = await getCountyByCityState(item)
      setMarkerPoints(listingData.listings.map((listing: SaleListing) => {
        return {
          lat: listing.latitude,
          lng: listing.longitude,
          address: listing.address,
          highlighted: false
        }
      }));
      setListingData(listingData);
      setRegionalData(regionalData)
    } catch (err) {
      console.log(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);


  return (
    <>
      {loading && (
        <div className=" z-1000 absolute inset-0 flex items-center text-white justify-center bg-black">
          Loading...
        </div>
      )}
      <Map 
        onSelectCoords={(lat, lng, level) => handleSelect(lat, lng, level)}
        onHover={handleHover} 
        onZoomChange={(zoom: number) => {
          setEnableListingButton(zoom > ENABLE_LISTINGS_BUTTON_LEVEL ? true : false)
        }}
        setLoading={setLoading}
        center={mapCenter}
        activeLayer={activeLayer}
        setMapBounds = {(value)=>{setMapBounds(value);console.log('mapbounds after set', mapBounds)}}
        markerPoints={markerPoints}
      />
      {(() => {
        switch (sidebarValue) {
          case "block":
            return regionalData ? (
              <Sidebar
                title={regionalData.title}
                regionalData={regionalData}
                onClose={() => {setRegionalData(null);setSidebarValue(null)}}
              />
            ) : null;

          case "county":
            return regionalData ? (
              <Sidebar
                title={regionalData.title}
                regionalData={regionalData}
                onClose={() => {setRegionalData(null);setSidebarValue(null)}}
              />
            ) : null;

          case "listings":
            return listingData && regionalData ? (
              <Sidebar
                title={regionalData.title}
                regionalData={regionalData}
                listingData={listingData}
                onClose={() => {setRegionalData(null);setSidebarValue(null)}}
                onListingSelect={(listing: SaleListing) => handleListingSelect(listing)}
              />
            ) : null;

          default:
            return null;
        }
      })()}
      
      {hover && <MapTooltip block={hover.block} x={hover.x} y={hover.y} countyName={hover.countyName} />}
      <Search 
        handleSubmit={(lat, lng, bbox) => {
          handleSelect(lat, lng, 'county')
          setMapCenter({lat: lat, lng: lng, bbox: bbox})
        }}
        handleViewListings={(item) => {
          console.log('viewing listings')
          setSidebarValue('listings')
          viewListings(item)
        }}
      />
      <Filters />
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
        onClick={() => {if (enableListingsButton){console.log('button');handleViewListingBtn();setSidebarValue('listings')}}}
        // onClick={() => {setSidebarValue('listings')}} // always enabled for testing purposes. uncomment above line when done
        className={cn("absolute right-4 bottom-4 z-100 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg  transition duration-300"
        ,enableListingsButton ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 hover:bg-gray-500' )}
      >
        View Listings
      </button>
    </>
  );
}
