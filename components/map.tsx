'use client';

import { useEffect, useRef, useState } from 'react';
import L, { LatLngTuple, HeatLatLngTuple } from 'leaflet';
import 'leaflet.heat';

import 'leaflet/dist/leaflet.css';


// import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';
import { pixelRadius } from '@/utils/convertToMeters';
import getCounties, { getBlocks } from '@/utils/api'
//for selecting coordinates
interface MapProps {
    onSelectCoords: (lat: number, lng: number) => void;
    onHover: (block: any | null, x: number, y: number) => void;
}
import { initialize } from 'next/dist/server/lib/render-server';
import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';

export default function Map({ onSelectCoords, onHover }: MapProps) {
    const pointsRef = useRef<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    const [heatPoints, setHeatPoints] = useState<HeatLatLngTuple[]>([]);
    const [loading, setLoading] = useState<Boolean>(true);

    var currentZoom = mapRef.current?.getZoom() || 5;

    const maxZoom = 15;
    const targetRadius = 30;

    // Generate the grid
    useEffect(() => {
        const fetchData = async ()=> {
            const points1 = await getBlocks();
            const points = points1.slice(1,3000);
            pointsRef.current = points;
            const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>{
                return [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
            })
            console.log('points: ',points, '\n', 'relevantPointValues', relevantPointValues)
            const grid = await generateTriangleGrid(
                relevantPointValues[0], // startingPoint
                relevantPointValues[1], // endingPoint
                relevantPointValues[2], // center
                40, // length
                relevantPointValues // data
            )

            console.log(grid)
            setHeatPoints(grid);
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
            zoom: currentZoom,
            layers: [osm],
        });

        mapRef.current = map;
        // Add click event listener to map for selecting coordinates
        map.on("click", (e: L.LeafletMouseEvent) => {
            onSelectCoords(e.latlng.lat, e.latlng.lng);
        });
        //ON HOVER STUFF
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
        map.on("mouseout", () => onHover(null, 0, 0));

        const heat = L.heatLayer(heatPoints, {
            radius: targetRadius,
            gradient: {
                0.4: 'blue',
                0.65: 'lime',
                0.995: 'orange',
                1.0: 'red'
            }

        }).addTo(map);

        var dataLevel = 'counties'

        // map.on('zoomend', () => {
        //     let multiplier = 1
        //     if(map.getZoom() > currentZoom){
        //         multiplier = 2
        //     }else{
        //         multiplier = 1/2
        //     }
        //     console.log('pixelrad: ', pixelRadius(targetRadius, map))

        //     heat.setOptions({ radius: pixelRadius(targetRadius, map)})

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