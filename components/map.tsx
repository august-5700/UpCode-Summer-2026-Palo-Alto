'use client';

import { use, useEffect, useRef, useState } from 'react';
import L, { LatLngTuple, HeatLatLngTuple, Map as MapType, HeatLayer, Layer } from 'leaflet';
import 'leaflet.heat';
import { rankNormalize } from '@/utils/normalize';

import 'leaflet/dist/leaflet.css';
import { heatRadiusForZoom } from '@/utils/heatRadius';

import { pixelRadius } from '@/utils/convertToMeters';
import getCounties, { getBlocksWithinRange} from '@/utils/api'
import { combinePoints } from '@/utils/combinePoints';
import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';
import { attachData, attachWeightedData } from '@/utils/attachDataFast';
import { computeHeatSimple } from '@/utils/score';
import { renderCountyChoropleth, valueToHex } from '@/utils/renderCountyChoropleth';



interface MapProps {
    onSelectCoords: (lat: number, lng: number, level: "county" | "block") => void;
    onHover: (block: any | null, x: number, y: number) => void;
    onZoomChange: (newZoom: number) => void;
    setLoading: (value:boolean) => void;
    center?: {
        lat: number;
        lng: number;
        bbox: [number, number, number, number];
    };
    activeLayer: string;
}




const maxZoom = 15;
const minZoom = 2;
const blockThreshold = 11;
const subDivisions = 95;


// How to convert points to heatmap tuples
const toHeatTuples = (points: any[]): HeatLatLngTuple[] => {
    const scores = points.map((pt: any) =>
        computeHeatSimple(pt.median_home_value, pt.median_gross_rent) || 0
    );
    const norm = rankNormalize(scores);
    return points.map((pt: any, i: number) => [pt.lat || 0, pt.long || 0, norm[i]]);
};

type PointLike = {
    lat?: number;
    latitude?: number;
    long?: number;
    lng?: number;
    lon?: number;
    [key: string]: any;
};

const renderMarkers = (
    points: PointLike[],
    map: MapType,
    markerLayerRef: { current: L.LayerGroup | null }
) => {
    markerLayerRef.current?.clearLayers();

    const layerGroup = L.layerGroup();

    points.forEach((point) => {
        const lat = point.lat ?? point.latitude;
        const lng = point.long ?? point.lng ?? point.lon ?? point.longitude;

        if (lat == null || lng == null) return;

        layerGroup.addLayer(
            L.circleMarker([lat, lng], {
                radius: 3,
                color: '#2563eb',
                fillColor: '#60a5fa',
                fillOpacity: 0.75,
                weight: 1,
            })
        );
    });

    layerGroup.addTo(map);
    markerLayerRef.current = layerGroup;
};


export default function Map({ onSelectCoords, onHover, onZoomChange, setLoading, center, activeLayer }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pointsRef = useRef<any[]>([]);
    const mapRef = useRef<L.Map | null>(null);
    const heatRef = useRef<any>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);
    const requestIdRef = useRef(0);
    const choroplethRef = useRef<L.GeoJSON | null>(null);
    const choroplethRequestIdRef = useRef(0);
    const activeLayerRef = useRef(activeLayer);

    useEffect(() => {
        activeLayerRef.current = activeLayer;
    }, [activeLayer]);
    
    const onSelectCoordsRef = useRef(onSelectCoords);
    const onHoverRef = useRef(onHover);
    useEffect(() => {
        onSelectCoordsRef.current = onSelectCoords;
        onHoverRef.current = onHover;
    }, [onSelectCoords, onHover]);

    // Single refresh function, all changes happen here
    // Calls when first initialized and when any movement happens, zoom/drag
    const refresh = async (map: MapType, heat: HeatLayer) => {

        // Creates request id for the called refresh function
        // Different id for each refresh call
        const requestId = ++requestIdRef.current;
        
        // Grabs zoom and bounds
        const zoom = map.getZoom();
        // if(zoom < minZoom) heatRef.current.setOptions({ zoom: minZoom });return;
        const bounds = map.getBounds()

        //padded bounds
        const padBounds = bounds.pad(1.0)
    
        // If the zoom is past the threshold the raw data is grabbed from blocks dataset
        // Otherwise its grabbed from counties dataset
        
        const raw = 
            zoom >= blockThreshold
                ? await getBlocksWithinRange(padBounds)
                : await getCounties();
        console.log("data")
        console.log(raw)

        
        // Checks if the requestId is current and that there is a map
        if(requestId !== requestIdRef.current || !mapRef.current) return;


        // Update pointsRef with the new raw data
        pointsRef.current = raw;
        renderMarkers(raw, map, markerLayerRef);

        // Sorts raw data
        
        const sorted = toHeatTuples(raw); // Removed the sort since the new method does not require it.
        

        // Finding the space between grid points
        
        const gridSpacing = bounds.getSouthEast().distanceTo(bounds.getSouthWest())/subDivisions;


        // Generating the grid
        const grid = generateTriangleGrid([bounds.getSouth(),bounds.getWest()], [bounds.getNorth(), bounds.getEast()], gridSpacing);


        // Taking sorted data and attaching to grid
        const combined = combinePoints(attachWeightedData(grid, sorted));


        // Updating the radius and blur
        const r = heatRadiusForZoom(map, gridSpacing);
        if (!heatRef.current._map) return;
        heatRef.current.setOptions({ radius: r, blur: r , maxZoom: zoom});

        // Updating the grid of heat points
        heat.setLatLngs(combined)

        setLoading(false);
    };

    const AUTO_SWITCH_ZOOM = 11;

    function updateLayerVisibility() {
        if (!mapRef.current || !heatRef.current || !choroplethRef.current) return;
        setLoading(true)

        const map = mapRef.current;
        const zoom = map.getZoom();

        const layer = activeLayerRef.current;

        const showHeat =
            layer === "heatmap" ||
            (layer === "default" && zoom >= AUTO_SWITCH_ZOOM);

        const showChoropleth =
            layer === "choropleth" ||
            (layer === "default" && zoom < AUTO_SWITCH_ZOOM);
        
        console.log('showheat', showHeat, 'showchr', showChoropleth)

        if (showHeat) {
            if (!map.hasLayer(heatRef.current))
                heatRef.current.addTo(map);
        } else {
            if (map.hasLayer(heatRef.current))
                map.removeLayer(heatRef.current);
        }

        if (showChoropleth) {
            if (!map.hasLayer(choroplethRef.current!)) {
                choroplethRef.current!.addTo(map);
            } 
        } else {
            if (map.hasLayer(choroplethRef.current!)) {
                map.removeLayer(choroplethRef.current!);
            }
        }

        setLoading(false)
    }

    useEffect(() => {
        console.log("Map useEffect started");
        // Checking if we have a container and that there isn't already a map in place
        if(!containerRef.current || mapRef.current) return;

        // Setting the Open Street Map layer
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
                maxZoom: maxZoom,
                attribution: '© OpenStreetMap'
        });

        // Setting the map and attaching the OSM layer
        const map = L.map(containerRef.current, {
            center: [40, -100] as LatLngTuple,
            zoom: 5,
            layers: [osm],
            zoomControl: false
        });
        // Storing the map in the mapRef object
        mapRef.current = map;

        // Creating the heat layer
        const heat = (L as any).heatLayer([], {
            radius: 25,
            blur: 15,
            gradient: {
                0.4: 'red',
                0.65: 'orange',
                0.995: 'lime',
                1.0: 'green'
            }
        }).addTo(map);

        heatRef.current = heat;
        
        async function loadChoropleth() {
            const requestId = ++choroplethRequestIdRef.current;

            const counties = await getCounties();

            const layer = await renderCountyChoropleth((feature) => {
                if (!feature.properties){
                    console.log('no properties')
                    return "#ffffff";
                }
                    
                const county = counties.filter((county: any)=>county.name == feature.properties?.NAME && county.state_fip == feature.properties?.STATEFP)[0]

                if (!county){
                    console.log('no county')
                    return "#ffffff";
                }
                    

                return valueToHex(
                    (county.median_gross_rent ?? -1) /
                    (county.median_home_value ?? -1),
                    0,
                    0.0075,
                    "#ff0000",
                    "#00ff00"
                );
            });

            // Ignore stale result
            if (
                requestId !== choroplethRequestIdRef.current ||
                !mapRef.current
            ) {
                return;
            }

            choroplethRef.current = layer;

            updateLayerVisibility();
        }
        loadChoropleth()
        console.log("Creating choropleth");

        // Listener for when user clicks, grabs user's latitude and longitude
        map.on("click", (e: L.LeafletMouseEvent) => {
            const level = map.getZoom() >= 11 ? 'block' : 'county';
            onSelectCoords(e.latlng.lat, e.latlng.lng, level);
        });

        // Listener for when user moves mouse, grabs user's latitude and longitude and finds nearest point
        let rafPending = false;
        map.on("mousemove", (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            const cx = e.originalEvent.clientX;
            const cy = e.originalEvent.clientY;
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                rafPending = false;
                const pts = pointsRef.current;
                if (!pts.length) { onHover(null, 0, 0); return; }
                let nearest = pts[0], best = Infinity;
                for (const p of pts) {
                    const d = (p.lat - lat) ** 2 + (p.long - lng) ** 2;
                    if (d < best) { best = d; nearest = p; }
                }
                onHover(nearest, cx, cy);
            });
        });

        // If the user's mouse ends up outside of the map, changes the point the user is hovering over to no point
        map.on("mouseout", () => onHover(null, 0, 0));

        // Checks if the user moves, zoom/drag, if so calls the refresh function
        map.on('moveend', () => {updateLayerVisibility();refresh(map, heat)});
        map.on('zoomend', () => {
            onZoomChange(map.getZoom())
        })

        // After all the initializing is finished calls refresh
        refresh(map, heat);

        // Cleanup function
        return () => {
            choroplethRequestIdRef.current++;
            requestIdRef.current++;

            map.remove();

            markerLayerRef.current?.clearLayers();
            markerLayerRef.current = null;
            mapRef.current = null;
            heatRef.current = null;
            choroplethRef.current = null;
        };
    }, []);

    // pan to the new center of the map if the center changes
    useEffect(() => {
        if (!center || !mapRef.current) return;
        console.log('center change')
        if (center.bbox) {
            const bounds = L.latLngBounds(
                [center.bbox[1], center.bbox[0]], // southwest
                [center.bbox[3], center.bbox[2]]  // northeast
            );

            mapRef.current.fitBounds(bounds, {
                padding: [40, 40],
                animate: true,
            });
        } else {
            mapRef.current.flyTo(
                [center.lat, center.lng],
                mapRef.current.getZoom(),
                {
                    animate: true,
                }
            );
        }
        // refresh(mapRef.current, heatRef.current)
    }, [center]);

    useEffect(() => {
        console.log("Map mounted");
    }, []);

    useEffect(() => {
        updateLayerVisibility();
    }, [activeLayer]);

return (
    <div className="relative w-screen h-screen overflow-hidden">

        <div
            ref={containerRef}
            className="absolute z-0"
            style={{
                width: '200vw',
                height: '200vh',
                left: '-50vw',
                top: '-50vh',
            }}
        />

    </div>
    );
}