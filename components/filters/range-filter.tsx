"use client";

import type { ComponentType } from "react";

export type RangeFilterProps = {
  label: string;
  value: [number, number]; // [min, max]
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  icon?: ComponentType<{ className?: string }>;
};

const THUMB =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-300 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-300 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow";

const INPUT = "pointer-events-none absolute inset-0 h-2 w-full appearance-none bg-transparent";

// Min-max range with two sides
export default function RangeFilter({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  icon: Icon,
}: RangeFilterProps) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const setLo = (v: number) => onChange([Math.min(v, hi), hi]);
  const setHi = (v: number) => onChange([lo, Math.max(v, lo)]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-600">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {label}
        </span>
        <span className="font-semibold text-gray-900">
          {format(lo)} – {format(hi)}
        </span>
      </div>

      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        <div
          className="absolute inset-y-0 rounded-full bg-emerald-500"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => setLo(Number(e.target.value))}
          className={`${INPUT} ${THUMB}`}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => setHi(Number(e.target.value))}
          className={`${INPUT} ${THUMB}`}
        />
      </div>
    </div>
  );
}
