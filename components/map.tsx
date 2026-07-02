'use client';

import { use, useEffect, useRef, useState } from 'react';
import L, { LatLngTuple, HeatLatLngTuple, Map as MapType } from 'leaflet';
import 'leaflet.heat';

import 'leaflet/dist/leaflet.css';
import { heatRadiusForZoom } from '@/utils/heatRadius';

import { pixelRadius } from '@/utils/convertToMeters';
import getCounties, { getBlocks, getBlocksWithinRange} from '@/utils/api'
import { combinePoints } from '@/utils/combinePoints';
//for selecting coordinates
interface MapProps {
    onSelectCoords: (lat: number, lng: number, level: 'county' | 'block') => void;
    onHover: (block: any | null, x: number, y: number) => void;
}
import { initialize } from 'next/dist/server/lib/render-server';
import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';
import { attachData, attachWeightedData } from '@/utils/attachData';
import { on } from 'node:cluster';
import { request } from 'node:http';

//for selecting coordinates
interface MapProps {
    onSelectCoords: (lat: number, lng: number, level: 'county' | 'block') => void;
    onHover: (block: any | null, x: number, y: number) => void;
}

const maxZoom = 15;
const blockThreshold = 11;
const subDivisions = 70
const multiplier = 100000;

// How to convert points to heatmap tuples
const toHeatTuples = (points: any[], map: MapType): HeatLatLngTuple[] =>
    points.map((pt:any) => [
        pt.lat || 0,
        pt.long || 0,
        (pt.median_gross_rent || 0)/(pt.median_home_value || 1) * (multiplier/map.getZoom())
    ]);


export default function Map({ onSelectCoords, onHover }: MapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pointsRef = useRef<any[]>([]);
    const mapRef = useRef<L.Map | null>(null);
    const heatRef = useRef<any>(null);
    const requestIdRef = useRef(0);

    const onSelectCoordsRef = useRef(onSelectCoords);
    const onHoverRef = useRef(onHover);
    useEffect(() => {
        onSelectCoordsRef.current = onSelectCoords;
        onHoverRef.current = onHover;
    }, [onSelectCoords, onHover]);

    const [loading, setLoading] = useState(true);
    useEffect(() => {
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
                0.4: 'blue',
                0.65: 'lime',
                0.995: 'orange',
                1.0: 'red'
            }
        }).addTo(map);
        heatRef.current = heat;

        // Single refresh function, all changes happen here
        // Calls when first initialized and when any movement happens, zoom/drag
        const refresh = async () => {

            // Creates request id for the called refresh function
            // Different id for each refresh call
            const requestId = ++requestIdRef.current;
            
            // Grabs zoom
            const zoom = map.getZoom();

            // If the zoom is past the threshold the raw data is grabbed from blocks dataset
            // Otherwise its grabbed from counties dataset
            const raw = 
                zoom >= blockThreshold
                    ? await getBlocksWithinRange(map)
                    : await getCounties();

            
            // Checks if the requestId is current and that there is a map
            if(requestId !== requestIdRef.current || !mapRef.current) return;


            // Update pointsRef with the new raw data
            pointsRef.current = raw;

            // Sorts raw data
            const sorted = toHeatTuples(raw, map).sort((a, b) => a[0] - b[0]);
            

            // Finding the space between grid points
            const bounds = map.getBounds()
            const gridSpacing = bounds.getSouthEast().distanceTo(bounds.getSouthWest())/subDivisions;


            // Generating the grid
            const grid = generateTriangleGrid([bounds.getSouth(),bounds.getWest()], [bounds.getNorth(), bounds.getEast()], gridSpacing);


            // Taking sorted data and attaching to grid
            const combined = combinePoints(attachWeightedData(grid, sorted));


            // Updating the radius and blur
            const r = heatRadiusForZoom(map, gridSpacing);
            heatRef.current.setOptions({ radius: r, blur: r * 0.5 });

            // Updating the grid of heat points
            heat.setLatLngs(combined)

            setLoading(false);
        };
        
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
        map.on('moveend', refresh);

        // After all the initializing is finished calls refresh
        refresh();

        // Cleanup function
        return () => {
            requestIdRef.current++;
            map.remove();
            mapRef.current = null;
            heatRef.current = null;
        };
    }, []);

return (
    <div className="relative w-screen h-screen">

        {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                Loading map...
            </div>
        )}

        <div
            ref={containerRef}
            className="w-full h-full z-0"
        />
    </div>
    );
}