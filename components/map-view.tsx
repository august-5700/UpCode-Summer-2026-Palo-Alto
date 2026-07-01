"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";
import MapTooltip from "./map-tooltip";
import { getTractByCoords, type TractData } from "@/utils/api";

type Hover = { block: any; x: number; y: number } | null;

const HOVER_DELAY = 1000; // ms of stillness before the tooltip shows
const MOVE_THRESHOLD = 10;  // px ... moves smaller than this then count as "still" (ignores jitter)

export default function MapView() {
  const [tract, setTract] = useState<TractData | null>(null);
  const [hover, setHover] = useState<Hover>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null); // where the current countdown started
  const latestRef = useRef<Hover>(null);                            // most recent block+position under the cursor

  const handleSelect = useCallback(async (lat: number, lng: number) => {
    const data = await getTractByCoords(lat, lng);
    setTract(data);
  }, []);

  const handleHover = useCallback((block: any | null, x: number, y: number) => {
    // Off the map then hide immediately
    if (!block) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      anchorRef.current = null;
      latestRef.current = null;
      setHover(null);
      return;
    }

    // Always remember what's actually under the cursor right now
    latestRef.current = { block, x, y };

    // Ignore tiny jitter so the cursor can settle
    const a = anchorRef.current;
    const moved = !a || Math.hypot(x - a.x, y - a.y) > MOVE_THRESHOLD;
    if (!moved) return;

    //  hide re-anchor,.. restart the countdown
    anchorRef.current = { x, y };
    setHover(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    // Show whatever is CURRENT when it fires... not the stale block from schedule time
    timerRef.current = setTimeout(() => setHover(latestRef.current), HOVER_DELAY);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <>
      <Map onSelectCoords={handleSelect} onHover={handleHover} />
      {tract && <Sidebar data={tract} onClose={() => setTract(null)} />}
      {hover && <MapTooltip block={hover.block} x={hover.x} y={hover.y} />}
    </>
  );
}
