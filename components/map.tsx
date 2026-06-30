'use client';

import { useEffect, useRef, useState } from 'react';
import L, { LatLngTuple, HeatLatLngTuple } from 'leaflet';
import 'leaflet.heat';

import 'leaflet/dist/leaflet.css';


// import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';
// import { pixelRadius } from '@/utils/grids/convertToMeters';
import { getBlocks } from '@/utils/api'
//for selecting coordinates
interface MapProps {
    onSelectCoords: (lat: number, lng: number) => void;
}

export default function Map({ onSelectCoords }: MapProps) {

    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    const [heatPoints, setHeatPoints] = useState<HeatLatLngTuple[]>([]);
    const [loading, setLoading] = useState<Boolean>(true);

    const startingZoom = 5;
    const maxZoom = 15;
    const targetRadius = 30;

    // Generate the grid
    useEffect(() => {
        const fetchData = async ()=> {
            const points1 = await getBlocks();
            const points = points1.slice(1,3000);
            const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>{
                return [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
            })
            console.log('points: ',points, '\n', 'relevantPointValues', relevantPointValues)
            setHeatPoints(relevantPointValues);
        }
        fetchData()

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
        // Add click event listener to map for selecting coordinates
        map.on("click", (e: L.LeafletMouseEvent) => {
            onSelectCoords(e.latlng.lat, e.latlng.lng);
        });

        const heat = L.heatLayer(heatPoints, {
            radius: targetRadius,
            gradient: {
                0.4: 'blue',
                0.65: 'lime',
                0.995: 'orange',
                1.0: 'red'
            }

        }).addTo(map);

        L.control.layers({
            OpenStreetMap: osm,
            HOT: osmHOT,
            Heat: heat,
        }).addTo(map);

        var currentZoom = map.getZoom();

        // map.on('zoomend', (event: L.LeafletEvent) => {
        //     let multiplier = 1
        //     if(map.getZoom() < currentZoom){
        //         multiplier = 2
        //     }else{
        //         multiplier = 1/2
        //     }

        //     heat.setOptions({ radius: pixelRadius(targetRadius, map) })

        //     heat.redraw()
        //     currentZoom = map.getZoom()
        // })
        
        setLoading(false)
        return () => {
            map.remove();
            mapRef.current = null;
        };

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