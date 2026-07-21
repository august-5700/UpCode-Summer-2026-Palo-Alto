"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";
import MapTooltip from "./map-tooltip";
import GuidedSelectionToast from "./comparison-selector";
import {
    getCounties,
    getBlockByCoords,
    getCountyByCoords,
    getCountyByCityState,
} from "@/utils/api";
import { Search } from "./search";
import { LayersToggle } from "./layer-toggle";
import { cn } from "@/lib/utils";
import { getListings, getListingsInArea } from "@/utils/listings";
import { SaleListing } from "@/utils/listings.types";
import { prepareWithDefaults } from "@/utils/listings/prepareListings";
import citySearch from "@/utils/citySearch";
import L from "leaflet";
import { MarkerType, SidebarContent, TractData } from "@/utils/types";
import LoadingToast from "./loading-toast";

type Hover = { block: any; x: number; y: number; countyName: string | null } | null;

const HOVER_DELAY = 1000; // ms of stillness before the tooltip shows
const MOVE_THRESHOLD = 10; // px, moves smaller than this count as still (ignores jitter)

// How close (in degrees) a map click must land to a listing marker to count as
// "clicking that listing" during guided listing comparison. ~0.02deg ≈ 2 km.
const LISTING_SELECT_RADIUS_DEG = 0.02;

// Two counties/blocks are "the same" region if their titles match. Used to
// avoid adding a duplicate column when the user re-selects the same area.
const sameRegion = (a: TractData, b: TractData) => a.title === b.title;

export default function MapView() {
    const [mapBounds, setMapBounds] = useState<L.LatLngBounds>(
        new L.LatLngBounds([0, 1], [0, -1])
    );

    // ── The single source of truth for the sidebar ─────────────────────────────
    // `sidebar` = { level, data }. `guiding` = which type the user is currently
    // being asked to pick a second of (drives the toast + constrains map clicks).
    const [sidebar, setSidebar] = useState<SidebarContent>({ level: null });
    const [guiding, setGuiding] = useState<"block" | "county" | "listing" | null>(null);
    const [markerPoints, setMarkerPoints] = useState<MarkerType[]>([]);

    const [hover, setHover] = useState<Hover>(null);
    const [mapCenter, setMapCenter] = useState<{
        lat: number;
        lng: number;
        bbox: [number, number, number, number];
    }>();
    const [enableListingsButton, setEnableListingButton] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    // separate from `loading` (which Map also drives) so the toast only shows
    // while the listings request is actually in flight
    const [fetchingListings, setFetchingListings] = useState(false);
    // only known once citySearch resolves, so the toast starts generic
    const [listingsCity, setListingsCity] = useState<string | null>(null);
    const [activeLayer, setActiveLayer] = useState<
        "default" | "heatmap" | "choropleth" | "none"
    >("default");

    // Map click handlers live inside Leaflet closures, so mirror the latest
    // state into refs they can read synchronously.
    const sidebarRef = useRef(sidebar);
    const guidingRef = useRef(guiding);
    useEffect(() => { sidebarRef.current = sidebar; }, [sidebar]);
    useEffect(() => { guidingRef.current = guiding; }, [guiding]);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const anchorRef = useRef<{ x: number; y: number } | null>(null);
    const latestRef = useRef<Hover>(null);
    const countyNamesRef = useRef<Record<string, string>>({}); // "state_fip-county_fip" -> name
    const ENABLE_LISTINGS_BUTTON_LEVEL = 8;

    // Markers are derived state: they only ever exist for a listing-level view,
    // and they're rebuilt whenever the listing set changes. Any other level (or
    // a closed sidebar) clears them — so nothing lingers on the map.
    useEffect(() => {
        if (sidebar.level === "listing") {
            setMarkerPoints(
                sidebar.listings.map((l) => ({
                    lat: l.latitude,
                    lng: l.longitude,
                    address: l.address,
                    highlighted: false,
                }))
            );
        } else {
            setMarkerPoints([]);
        }
    }, [sidebar]);

    // load county names once so tract-level hovers can show the county name
    useEffect(() => {
        getCounties().then((counties: any[]) => {
            const lookup: Record<string, string> = {};
            for (const c of counties) lookup[`${c.state_fip}-${c.county_fip}`] = c.name;
            countyNamesRef.current = lookup;
        });
    }, []);

    // ── Region fetching ────────────────────────────────────────────────────────
    const fetchRegion = useCallback(
        async (lat: number, lng: number, level: "block" | "county") =>
            level === "block"
                ? await getBlockByCoords(lat, lng)
                : await getCountyByCoords(lat, lng),
        []
    );

    // Nearest listing to a click, but only if it's within the select radius.
    const closestListingWithin = (
        listings: SaleListing[],
        lat: number,
        lng: number
    ): SaleListing | null => {
        let best: SaleListing | null = null;
        let bestDist = Infinity;
        for (const l of listings) {
            if (l.latitude == null || l.longitude == null) continue;
            const d = Math.hypot(l.latitude - lat, l.longitude - lng);
            if (d < bestDist) {
                bestDist = d;
                best = l;
            }
        }
        return best && bestDist <= LISTING_SELECT_RADIUS_DEG ? best : null;
    };

    // ── The one entry point for every map click ────────────────────────────────
    // Behaviour depends entirely on `guiding`:
    //   • not guiding        -> replace the sidebar with the single clicked region
    //   • guiding a region   -> append the clicked region as a comparison column
    //   • guiding a listing  -> snap to the nearest listing and add it as a column
    const onMapSelect = useCallback(
        async (lat: number, lng: number, zoomLevel: "county" | "block") => {
            const g = guidingRef.current;

            // Guided listing comparison: only listings are selectable.
            if (g === "listing") {
                const sb = sidebarRef.current;
                if (sb.level !== "listing") return;
                const picked = closestListingWithin(sb.listings, lat, lng);
                if (!picked) return; // clicked nowhere near a listing -> do nothing
                setSidebar((prev) => {
                    if (prev.level !== "listing") return prev;
                    if (prev.comparing.some((c) => c.id === picked.id)) return prev;
                    // Clear transient browse selection so nothing carries into
                    // (or back out of) comparison view.
                    prev.listings.forEach((x) => {
                        x.selected = false;
                    });
                    return { ...prev, comparing: [...prev.comparing, picked] };
                });
                setGuiding(null);
                return;
            }

            // Guided region comparison: force the type we're comparing, append it.
            if (g === "county" || g === "block") {
                const data = await fetchRegion(lat, lng, g);
                if (!data) return; // clicked empty space -> stay in guided mode
                setSidebar((prev) => {
                    if (prev.level !== g) return { level: g, regions: [data] };
                    if (prev.regions.some((r) => sameRegion(r, data))) return prev;
                    return { level: g, regions: [...prev.regions, data] };
                });
                setGuiding(null);
                return;
            }

            // Normal click: collapse to the single clicked region. This drops any
            // listings/markers and exits comparison automatically.
            const data = await fetchRegion(lat, lng, zoomLevel);
            if (!data) return;
            setSidebar({ level: zoomLevel, regions: [data] });
        },
        [fetchRegion]
    );

    // ── Listings entry points (search + "View Listings" button) ────────────────
    // Both collapse the sidebar to a single listing-level view for one area,
    // clearing comparison and any prior region/listing data.
    const showListings = useCallback(
        async (
            title: string,
            region: TractData | null,
            listings: SaleListing[],
            meta?: { complete?: boolean; rentalCount?: number; rentalTotal?: number }
        ) => {
            const ranked = prepareWithDefaults(listings);
            setGuiding(null);
            setSidebar({
                level: "listing",
                title,
                region,
                listings: ranked,
                comparing: [],
                meta,
            });
        },
        []
    );

    const viewListings = useCallback(async (item: string[]) => {
        if (item.length !== 2) return;
        try {
            setLoading(true);
            setFetchingListings(true);
            setListingsCity(item[0]?.trim() || null);
           
            const result = await getListings(item[0], item[1], 2000, 1500);
            const region = await getCountyByCityState(item);
            await showListings(item[0], region, result.listings, {
                complete: result.complete,
                rentalCount: result.rentalCount,
                rentalTotal: result.rentalTotal,
            });
        } catch (err) {
            console.log(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
            setFetchingListings(false);
        }
    }, [showListings]);

    const handleViewListingBtn = useCallback(async () => {
    try {
        setLoading(true);

        // 1. Which cities fall inside the current viewport.
        const cityRange = await citySearch(
            [mapBounds.getSouth(), mapBounds.getWest()],
            [mapBounds.getNorth(), mapBounds.getEast()]
        );
        console.log("[ViewListings] cities in viewport:", cityRange);

        // 2. Populate the DB one city at a time. Each getListings caches into the
        //    DB, and we await every one before the area query so getListingsInArea
        //    reads a fully-populated DB rather than an empty/stale one.
        for (const [city, state] of cityRange as [string, string][]) {
            const c = city.trim();
            const s = state.trim();
            console.log(`[ViewListings] fetching listings for ${c}, ${s}`);
            const data = await getListings(c, s, 2000, 1000);
            console.log(
                `[ViewListings] ${c}, ${s} -> ${data.listings.length} listings cached`
            );
        }

        // 3. Now read every listing in the viewport from the populated DB.
        const listings = await getListingsInArea(
            mapBounds.getWest(),
            mapBounds.getSouth(),
            mapBounds.getEast(),
            mapBounds.getNorth()
        );
        console.log(`[ViewListings] area query -> ${listings.length} listings`);

        const center = mapBounds.getCenter();
        const region = await getCountyByCoords(center.lat, center.lng);
        const title = cityRange?.[0]?.[0]?.trim() || "this area";
        await showListings(title, region, listings);
    } catch (err) {
        console.log(err instanceof Error ? err.message : "Something went wrong");
    } finally {
        setLoading(false);
    }
}, [mapBounds, showListings]);
    
    // ── Sidebar callbacks ──────────────────────────────────────────────────────

    // Compare button. From a region view -> start guiding that region type.
    // From a listing view -> guide picking more listings (keeping any already chosen).
    const startCompare = useCallback(() => {
        const sb = sidebarRef.current;
        if (sb.level === "county" || sb.level === "block") setGuiding(sb.level);
        else if (sb.level === "listing") setGuiding("listing");
    }, []);

    // "Compare" on a specific listing card: it becomes the first column, then we
    // guide the user to pick the second.
    const startListingCompare = useCallback((first: SaleListing) => {
        setSidebar((prev) =>
            prev.level === "listing" ? { ...prev, comparing: [first] } : prev
        );
        setGuiding("listing");
    }, []);

    // Highlight the pin for the clicked listing card (browse view).
    const handleListingSelect = useCallback((listing: SaleListing) => {
        setMarkerPoints((prev) =>
            prev.map((marker) => ({
                ...marker,
                highlighted: marker.address === listing.address,
            }))
        );
    }, []);

    const removeSet = useCallback((index: number) => {
        setSidebar((prev) => {
            if (prev.level === "county" || prev.level === "block") {
                const regions = prev.regions.filter((_, i) => i !== index);
                return regions.length ? { ...prev, regions } : { level: null };
            }
            if (prev.level === "listing") {
                const comparing = prev.comparing.filter((_, i) => i !== index);
                // Drop back to browse view (and forget the leftover) below 2 columns.
                return { ...prev, comparing: comparing.length >= 2 ? comparing : [] };
            }
            return prev;
        });
    }, []);

    const removeListing = useCallback((l: SaleListing) => {
        setSidebar((prev) =>
            prev.level === "listing"
                ? {
                      ...prev,
                      listings: prev.listings.filter((x) => x.id !== l.id),
                      comparing: prev.comparing.filter((x) => x.id !== l.id),
                  }
                : prev
        );
    }, []);

    // Close wipes everything: content, comparison, guided mode, and (via the
    // marker effect) all pins.
    const closeSidebar = useCallback(() => {
        setGuiding(null);
        setSidebar({ level: null });
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

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    return (
        <>

            <GuidedSelectionToast type={guiding} onCancel={() => setGuiding(null)} />
            <LoadingToast
                show={fetchingListings}
                message={listingsCity ? `Fetching listings in ${listingsCity}` : undefined}
            />

            <Map
                onSelectCoords={onMapSelect}
                onHover={handleHover}
                onZoomChange={(zoom: number) => {
                    setEnableListingButton(zoom > ENABLE_LISTINGS_BUTTON_LEVEL);
                }}
                setLoading={setLoading}
                center={mapCenter}
                activeLayer={activeLayer}
                setMapBounds={setMapBounds}
                markerPoints={markerPoints}
            />

            <Sidebar
                content={sidebar}
                onClose={closeSidebar}
                onStartCompare={startCompare}
                onStartListingCompare={startListingCompare}
                onRemoveSet={removeSet}
                onRemoveListing={removeListing}
                onListingSelect={handleListingSelect}
            />

            {hover && (
                <MapTooltip
                    block={hover.block}
                    x={hover.x}
                    y={hover.y}
                    countyName={hover.countyName}
                />
            )}

            <Search
                handleSubmit={(lat, lng, bbox, item) => {
                    setMapCenter({ lat, lng, bbox });
                    viewListings(item);
                }}
            />

            <LayersToggle
                value={activeLayer}
                onValueChange={(value: string) => {
                    if (
                        value == "default" ||
                        value == "heatmap" ||
                        value == "choropleth" ||
                        value == "none"
                    ) {
                        setActiveLayer(value);
                    } else {
                        setActiveLayer("default");
                    }
                }}
            />

            <button
                disabled={!enableListingsButton || fetchingListings}
                onClick={() => {
                    if (enableListingsButton && !fetchingListings) handleViewListingBtn();
                }}
                className={cn(
                    "absolute right-4 bottom-4 z-100 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg  transition duration-300",
                    enableListingsButton && !fetchingListings
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
                )}
            >
                {fetchingListings ? 'Fetching…' : 'View Listings'}
            </button>
        </>
    );
}
