'use client';

import { useEffect, useRef, useState } from 'react';
import L, { HeatLatLngTuple, LatLngTuple } from 'leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';

export default function Map() {

    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    const [heatPoints, setHeatPoints] = useState<HeatLatLngTuple[]>([]);
    const [loading, setLoading] = useState<Boolean>(true);

    const startingZoom = 5;
    const maxZoom = 15;
    const targetRadius = 30;

    // Generate the grid
    useEffect(() => {
        const points = generateTriangleGrid(
            [50.1, -110],
            [50.0, -110],
            [40, -100],
            50,
            5
        );
        
        setHeatPoints(points);

    }, []);

    // Create the map after data is ready
    useEffect(() => {
        if (!containerRef.current) return;
        if (mapRef.current) return;
        // if (heatPoints.length === 0) return;
        setLoading(true);

        const osm = L.tileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom,
                attribution: '© OpenStreetMap'
            }
        );

        const osmHOT = L.tileLayer(
            'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution:
                    '© OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
            }
        );

        const startingCenter: LatLngTuple = [
            40, -100
        ];

        const map = L.map(containerRef.current, {
            center: startingCenter,
            zoom: startingZoom,
            layers: [osm],
        });

        mapRef.current = map;

        const heat = L.heatLayer(heatPoints, {
            radius: targetRadius,
        }).addTo(map);

        L.control.layers({
            OpenStreetMap: osm,
            HOT: osmHOT,
            Heat: heat,
        }).addTo(map);

        return () => {
            map.remove();
            mapRef.current = null;
        };
        setLoading(false)

    }, [heatPoints]);

    return (
    <div className="relative w-screen h-screen">

        {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
                Loading map...
            </div>
        )}

        <div
            ref={containerRef}
            className="w-full h-full"
        />
    </div>
    );
}