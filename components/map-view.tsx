"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";
import MapTooltip from "./map-tooltip";
import getCounties, { getTractByCoords, getCountyByCoords, type TractData } from "@/utils/api";
import { Search } from "./search";
import { Filters } from "./filters";
import { LatLngTuple } from "leaflet";

type Hover = { block: any; x: number; y: number; countyName: string | null } | null;

const HOVER_DELAY = 1000; // ms of stillness before the tooltip shows
const MOVE_THRESHOLD = 10; // px, moves smaller than this count as still (ignores jitter)

export default function MapView() {
  const [tract, setTract] = useState<TractData | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [mapCenter, setMapCenter] = useState<{
      lat: number;
      lng: number;
      bbox: [number, number, number, number];
  }>();


  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const latestRef = useRef<Hover>(null);
  const countyNamesRef = useRef<Record<string, string>>({}); // "state_fip-county_fip" -> name

  // load county names once so tract-level hovers can show the county name
  useEffect(() => {
    getCounties().then((counties: any[]) => {
      const lookup: Record<string, string> = {};
      for (const c of counties) lookup[`${c.state_fip}-${c.county_fip}`] = c.name;
      countyNamesRef.current = lookup;
    });
  }, []);

  const handleSelect = useCallback(async (lat: number, lng: number, level: "county" | "block") => {
    const data = level === "block" ? await getTractByCoords(lat, lng) : await getCountyByCoords(lat, lng);
    setTract(data);
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

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <>
      <Map 
        onSelectCoords={(lat, lng, level) => handleSelect(lat, lng, level)}
        onHover={handleHover} 
        center={mapCenter}
      />
      {tract && <Sidebar data={tract} onClose={() => setTract(null)} />}
      {hover && <MapTooltip block={hover.block} x={hover.x} y={hover.y} countyName={hover.countyName} />}
      <Search handleSubmit={(lat, lng, bbox) => {
        handleSelect(lat, lng, 'county')
        setMapCenter({lat: lat, lng: lng, bbox: bbox})
        }}/>
      <Filters />
    </>
  );
}
