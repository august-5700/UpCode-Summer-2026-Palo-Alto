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

// small white round thumb for moving the slider
const THUMB =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black/10 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-black/10 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow";

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
      <Icon className="h-4 w-4 shrink-0 text-gray-500" />
      <div className="relative h-1.5 flex-1">
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(to_right,#ef4444,#f59e0b,#eab308,#84cc16,#22c55e)]" />
        <div className="absolute inset-y-0 left-0 rounded-full bg-gray-300" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`absolute inset-0 -my-1.5 h-[calc(0.375rem+0.75rem)] w-full cursor-pointer appearance-none bg-transparent ${THUMB}`}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">{format(value)}</span>
    </div>
  );
}
