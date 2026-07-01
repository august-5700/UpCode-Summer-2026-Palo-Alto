"use client";

import { useCallback, useState } from "react";
import Map from "./map";
import Sidebar from "./sidebar";
import { getTractByCoords, type TractData } from "@/utils/api";

export default function MapView() {
  const [tract, setTract] = useState<TractData | null>(null);

  const handleSelect = useCallback(async (lat: number, lng: number) => {
    const data = await getTractByCoords(lat, lng);
    setTract(data); // null over empty areas → sidebar closes
  }, []);

  return (
    <>
      <Map onSelectCoords={handleSelect} />
      {tract && <Sidebar data={tract} onClose={() => setTract(null)} />}
    </>
  );
}
