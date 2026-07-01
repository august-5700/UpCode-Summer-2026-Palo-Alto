'use client';

import { useEffect, useRef, useState } from 'react';
import L, { LatLngTuple, HeatLatLngTuple } from 'leaflet';
import 'leaflet.heat';

import 'leaflet/dist/leaflet.css';
import { heatRadiusForZoom } from '@/utils/heatRadius';

import { pixelRadius } from '@/utils/convertToMeters';
import getCounties, { getBlocks, getBlocksWithinRange} from '@/utils/api'
import { combinePoints } from '@/utils/combinePoints';
//for selecting coordinates
interface MapProps {
    onSelectCoords: (lat: number, lng: number) => void;
    onHover: (block: any | null, x: number, y: number) => void;
}
import { initialize } from 'next/dist/server/lib/render-server';
import { generateTriangleGrid } from '@/utils/grids/generateTriangleGrid';
import { attachData, attachWeightedData } from '@/utils/attachData';

export default function Map({ onSelectCoords, onHover }: MapProps) {
    const pointsRef = useRef<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);

    const [heatPoints, setHeatPoints] = useState<HeatLatLngTuple[]>([]);
    var sortedData: HeatLatLngTuple[] = [];
    const [loading, setLoading] = useState<Boolean>(true);

    var currentZoom = mapRef.current?.getZoom() || 5;
    let grid_spacing = 25000
    var dataLevel = currentZoom >= 11 ? 'blocks' : 'counties';

    const maxZoom = 15;
    const targetRadius = 30;

    // Generate the grid
    useEffect(() => {
        const fetchData = async ()=> {
            
            const points= await getCounties();

            pointsRef.current = points;
            const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>{
                return [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
            })
            console.log('points: ',points, '\n', 'relevantPointValues', relevantPointValues)

            const lats = relevantPointValues.map((p) => p[0]);
            const lngs = relevantPointValues.map((p) => p[1]);
            const bottomLeft: LatLngTuple = [Math.min(...lats), Math.min(...lngs)];
            const topRight: LatLngTuple = [Math.max(...lats), Math.max(...lngs)];
            sortedData = [...relevantPointValues].sort((a, b) => a[0] - b[0]);
            const grid = generateTriangleGrid(
                bottomLeft,
                topRight,
                grid_spacing, // spacing in equator-meters (Mercator units)
            );
            const withData = attachWeightedData(grid, sortedData);
            const combinedDataPoints = combinePoints(withData)

            console.log(combinedDataPoints);
            setHeatPoints(combinedDataPoints);
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


        const startingCenter: LatLngTuple = [40, -100];
        console.log(mapRef.current)

        const map = L.map(containerRef.current, {
            center: startingCenter,
            zoom: currentZoom,
            layers: [osm],
            zoomControl: false
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
            radius: heatRadiusForZoom(map, grid_spacing),
            blur: heatRadiusForZoom(map, grid_spacing) * 0.5,
            gradient: {
                0.4: 'blue',
                0.65: 'lime',
                0.995: 'orange',
                1.0: 'red'
            }

        }).addTo(map);

        var dataLevel = 'counties'

        map.on('zoomend', async () => {
            if(currentZoom >= 11){
                console.log("switch to blocks");

                const points = await getBlocksWithinRange(map);

                const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>{
                    return [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
                })
                console.log('points: ',points, '\n', 'relevantPointValues', relevantPointValues)
                sortedData = relevantPointValues.sort((a, b) => a[0] - b[0]);

            } else if(currentZoom < 11){
                console.log("switch to counties")

                const countyPoints = async () =>{
                    const points = await getCounties();
                    const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>{
                        return [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
                    })
                    console.log('points: ',points, '\n', 'relevantPointValues', relevantPointValues)
                    return relevantPointValues.sort((a, b) => a[0] - b[0]);
                }
                sortedData = await countyPoints()
            }
            
            const subDivisions = 70
            grid_spacing = map.getBounds().getSouthEast().distanceTo(map.getBounds().getNorthWest())/subDivisions;
            console.log(grid_spacing)

            const grid = generateTriangleGrid(
                [map.getBounds().getSouth(),map.getBounds().getWest()], 
                [map.getBounds().getNorth(), map.getBounds().getEast()], 
                grid_spacing
            );
            // console.log(grid);
            console.log("hihihihi")
            console.log(sortedData);

            const withData = attachWeightedData(grid, sortedData);
            const combinedDataPoints = combinePoints(withData);

            console.log(combinedDataPoints);
            setHeatPoints(combinedDataPoints);


            const r = heatRadiusForZoom(map, grid_spacing);
            heat.setOptions({ radius: r, blur: r * 0.5 });
            heat.setOptions({ radius: heatRadiusForZoom(map, grid_spacing) });

            heat.redraw();
            currentZoom = map.getZoom();
            console.log(currentZoom)
            console.log(dataLevel)
        })

        map.on("drag", async () => {
            const points = await getBlocksWithinRange(map);
            const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>{
                return [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
            })
            console.log('points: ',points, '\n', 'relevantPointValues', relevantPointValues)
            setHeatPoints(relevantPointValues);
            var moved = true;
        });
        
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
            className="w-full h-full z-0"
        />
    </div>
    );
}