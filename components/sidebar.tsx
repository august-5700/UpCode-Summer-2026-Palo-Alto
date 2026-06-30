"use client";

import { useState } from "react";
import { X, Home, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for now
const MOCK = {
  title: "San Jose, Tract 421",
  score: 9.8, // out of 10
  regional: 96,
  national: 99,
  metrics: [
    { label: "Median Home Value", value: "$1,250,000", sub: "±$35,000", change: "8%" },
  ],
};

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const data = MOCK;

  if (!open) return null;

  return (
    <Card className="absolute left-6 top-6 z-[1000] w-80 rounded-3xl bg-white/95 p-6 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-bold">{data.title}</h2>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Score */}
      <p className="mt-4 text-sm font-semibold">HeatMap Score</p>
      <p className="text-center text-7xl font-extrabold text-green-600">{data.score}</p>

      {/* Percentiles */}
      <div className="mt-4 flex justify-between text-sm">
        <span><span className="font-bold text-emerald-600">{data.regional}%</span> · Regional</span>
        <span><span className="font-bold text-violet-600">{data.national}%</span> · National</span>
      </div>

      {/* Gradient score bar with marker */}
      <div className="relative mt-2 h-3 w-full rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gray-300 bg-white shadow"
          style={{ left: `${data.score * 10}%` }}
        />
      </div>

      <hr className="my-5" />

      {/* Key Metrics */}
      <p className="mb-3 font-bold">Key Metrics</p>
      <div className="space-y-3">
        {data.metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Home className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="font-bold">
                {m.value} <span className="text-xs font-normal text-gray-400">{m.sub}</span>
              </p>
            </div>
            <div className="text-right text-emerald-600">
              <p className="flex items-center gap-1 text-sm font-semibold">
                <TrendingUp className="h-4 w-4" /> {m.change}
              </p>
              <p className="text-xs text-gray-400">YoY</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
