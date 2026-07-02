"use client";

import type { ComponentType } from "react";

export type SliderFilterProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string; // how to display the current value, for example money
  icon?: ComponentType<{ className?: string }>;
};

// Single-minimum slider (e.g. "min home value", "min heat score")
export default function SliderFilter({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  icon: Icon,
}: SliderFilterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-gray-600">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {label}
        </span>
        <span className="font-semibold text-gray-900">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-emerald-500"
      />
    </div>
  );
}
