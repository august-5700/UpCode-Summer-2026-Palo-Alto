"use client";

import type { ComponentType } from "react";

export type BooleanFilterProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: ComponentType<{ className?: string }>;
};

// On/off toggle
export default function BooleanFilter({ label, value, onChange, icon: Icon }: BooleanFilterProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-emerald-500" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}
