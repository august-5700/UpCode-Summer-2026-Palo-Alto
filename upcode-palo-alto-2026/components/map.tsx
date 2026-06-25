'use client';

import { useEffect, useRef } from 'react';
import L, { HeatLatLngTuple, heatLayer, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

export default function Map() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const heatData:HeatLatLngTuple[] = [
      [40, -110, 100.0], // lat, lng, intensity
      [50.52, 30.5, 20.0], // lat, lng, intensity
      [50.6, 30.4, 1.0],
      [50.62, 30.4, 1.0],
  ]

  const startingZoom = 8;
  const maxZoom = 15;
  const startingCenter:LatLngTuple = heatData[0]
  const targetRadius = 3000;
  
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // base street map layer
    const osm = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: maxZoom,
        attribution: '© OpenStreetMap',
      }
    );

    const map = L.map(containerRef.current, {
      center: startingCenter,
      zoom: startingZoom,
      layers: [osm],
    });

    mapRef.current = map;
    
    // declare layers here
    const osmHOT = L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '© OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
      }
    );


    // Converting target meters into pixels
    const pixelRadius = (meters:number, map:L.Map) => {
        const lat = map.getCenter().lat;
        const metersPerPixel = 40075016.686 * Math.abs(Math.cos((lat * Math.PI) / 180)) / Math.pow(2, map.getZoom() + 8);
        return meters / metersPerPixel;
    }

    const heat = L.heatLayer(heatData, {radius: 10}).addTo(map);
    // const heat = L.heatLayer(heatData, {radius: pixelRadius(targetRadius, map)}).addTo(map);

    // add layers to the map
    L.control
      .layers({
        OpenStreetMap: osm,
        HOT: osmHOT,
        HeatLayer: heat
      })
      .addTo(map);



    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

//   useEffect(()=>{
//     heatLayer.setOptions({ radius: pixelRadius(targetRadius, map) })
//     heatLayer.redraw()
//   }, [mapRef.current?.getZoom()])

  return <div ref={containerRef} className="w-screen h-screen" />;
}