"use client";

import type { ComponentType } from "react";

export type MinSliderProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  icon: ComponentType<{ className?: string }>;
};

// big gray round thumb for mving slider
const THUMB =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:shadow-md " +
  "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gray-400 [&::-moz-range-thumb]:shadow-md";

// A "minimum" slider. everything to the right of the thumb (kept) is the gradient,
// everything to the left (excluded) is gray.
export default function MinSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  icon: Icon,
}: MinSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0 text-gray-700" />
      <div className="relative h-2 flex-1">
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(to_right,#ef4444,#f59e0b,#eab308,#84cc16,#22c55e)]" />
        <div className="absolute inset-y-0 left-0 rounded-full bg-gray-300" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent ${THUMB}`}
        />
      </div>
      <span className="w-24 shrink-0 text-right font-bold text-gray-900">{format(value)}</span>
    </div>
  );
}
