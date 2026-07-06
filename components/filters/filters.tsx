"use client";

import { useState } from "react";
import { Filter, Home, DollarSign, BarChart3, Star } from "lucide-react";
import MinSlider from "./min-slider";

const money = (v: number) => "$" + Math.round(v).toLocaleString();

// later this lifts up so the map/hover/sidebar can read it?
export default function Filters() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ homeValue: 0, rent: 0, units: 0, score: 0 });
  const set = (k: keyof typeof values) => (v: number) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <>
      {/* Panel — expands out from behind the button when open. Header is
          flush to the top so its title lines up with the fixed button. */}
      {open && (
        <div className="absolute top-4 left-72 z-[1000] w-80 overflow-hidden rounded-3xl border border-white/40 bg-white/50 shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
          <div className="flex h-11 items-center pl-16 pr-4">
            <p className="text-sm font-semibold text-gray-800">Filter (by minimum)</p>
          </div>

          <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
            <MinSlider icon={Home} value={values.homeValue} onChange={set("homeValue")} min={0} max={2000000} step={1000} format={money} />
            <MinSlider icon={DollarSign} value={values.rent} onChange={set("rent")} min={0} max={5000} step={50} format={money} />
            <MinSlider icon={BarChart3} value={values.units} onChange={set("units")} min={0} max={100000} step={100} format={(v) => v.toLocaleString()} />
            <MinSlider icon={Star} value={values.score} onChange={set("score")} min={0} max={10} step={0.1} format={(v) => `${v.toFixed(1)} / 10`} />
          </div>
        </div>
      )}

      {/* The one funnel button: same spot, same look, opens AND closes. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="absolute top-4 left-72 z-[1001] flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/50 shadow-lg backdrop-blur-2xl backdrop-saturate-150 transition hover:bg-white/70"
      >
        <Filter className="h-5 w-5 text-gray-800" />
      </button>
    </>
  );
}
