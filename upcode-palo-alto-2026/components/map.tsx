'use client';

import { useEffect, useRef } from 'react';
import L, {HeatLatLngTuple, LatLng, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import triangleGrid from '@/../grid'

export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);


    async function triangleGrid(startingPoint:LatLngTuple, endingPoint:LatLngTuple, center:LatLngTuple ,length:number, intensity:number){
        var grid:HeatLatLngTuple[] = []


        const v1x = startingPoint[0] - endingPoint[0] // x distance between start and end
        const v1y:number = startingPoint[1] - endingPoint[1] // y distance from start to end 


        const angle = Math.PI/3
        const v2x = v1x * Math.cos(angle) - v1y * Math.sin(angle)
        const v2y = v1x * Math.sin(angle) + v1y * Math.cos(angle)


        const xLeftLimit = center[0] - length/2
        const xRightLimit = center[0] + length/2
        const yTopLimit = center[1] - length/2
        const yBottomLimit = center[1] + length/2


        const hyp = Math.sqrt(v1x**2 + v1y**2)
        const limits = Math.floor(length/hyp) + 3


        for (let i = -limits; i < limits+1; i ++) {
        
            for (let j = -limits; j < limits+1; j ++){
                let y = startingPoint[0] + j * v1x
                let x = startingPoint[1] + j * v1y
                y += i * v2x
                x += i * v2y

                var url = `https://nominatim.openstreetmap.org/reverse?lat=${y}&lon=${x}&format=json`
                var country = "";

                await fetch(url, {
                  headers: {
                    'User-Agent': 'YourAppName (your-email@example.com)' 
                    }
                  })
                .then(response => response.json())
                .then(data => {
                  country = data.address.country;
                })
                .catch(err => console.error("Error:", err));

                if (country == "United States"){
                    grid.push([y,x, intensity] as HeatLatLngTuple)
                }
            }
    
        }

        // const tmp:LatLngTuple[] =  [
        //     [40.1, -110],
        //     [40, -110],
        //     [40, -100],
        // ]

        // tmp.forEach((pt:LatLngTuple)=>{
        //     grid.push([pt[0], pt[1], 1000.0])
        // })

        return grid as HeatLatLngTuple[] 
    }
  



  const startingZoom = 5;
  const maxZoom = 15;


  const targetRadius = 30;
  
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

    const heatData:HeatLatLngTuple[] = triangleGrid(
        [50.1, -110],
        [50, -110],
        [40, -100],
        5,
        5
    )
    console.log(heatData.length)

    const startingCenter:LatLngTuple = heatData[0]

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

    const heat = L.heatLayer(heatData, {radius: targetRadius}).addTo(map);
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