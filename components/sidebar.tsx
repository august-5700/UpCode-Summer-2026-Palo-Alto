"use client";

import { useState } from "react";
import { X, Home, DollarSign, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for now
const MOCK = {
  title: "San Jose, Tract 421",
  score: 9.8, // out of 10
  regional: 96,
  national: 99,
  metrics: [
    { label: "Median Home Value", value: "$1,250,000", sub: "±$35,000", change: 8, icon: Home },
    { label: "Median Gross Rent", value: "$3,400", sub: "/mo", change: 5, icon: DollarSign },
    { label: "Price-to-Rent Ratio", value: "30.6", sub: "", change: -2, icon: Building2 },
  ],
};

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const data = MOCK;

  if (!open) return null;

  return (
    <Card className="absolute right-0 top-0 z-[1000] flex h-screen w-[420px] flex-col gap-6 overflow-y-auto rounded-l-3xl border-0 bg-white/95 p-8 shadow-2xl backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{data.title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-1 rounded-full text-gray-400 hover:text-gray-900"
          onClick={() => setOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Score */}
      <section className="flex flex-col items-center">
        <p className="self-start text-xs font-semibold uppercase tracking-wider text-gray-500">
          HeatMap Score
        </p>
        <p className="mt-1 flex items-baseline gap-1 font-extrabold leading-none text-green-600">
          <span className="text-8xl">{data.score}</span>
          <span className="text-2xl text-gray-300">/10</span>
        </p>

        {/* Percentiles */}
        <div className="mt-6 flex w-full justify-between text-sm">
          <span>
            <span className="font-bold text-emerald-600">{data.regional}%</span>
            <span className="text-gray-500"> · Regional</span>
          </span>
          <span>
            <span className="font-bold text-violet-600">{data.national}%</span>
            <span className="text-gray-500"> · National</span>
          </span>
        </div>

        {/* Gradient score bar with marker */}
        <div className="relative mt-2 h-2.5 w-full rounded-full bg-[linear-gradient(to_right,#ef4444,#f59e0b,#eab308,#22c55e,#3b82f6)]">
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white shadow-md ring-1 ring-black/10"
            style={{ left: `${data.score * 10}%` }}
          />
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Key Metrics */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Key Metrics
        </p>
        <div className="flex flex-col gap-1">
          {data.metrics.map((m) => {
            const Icon = m.icon;
            const up = m.change >= 0;
            return (
              <div
                key={m.label}
                className="-mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Icon className="h-5 w-5 text-emerald-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-500">{m.label}</p>
                  <p className="font-bold text-gray-900">
                    {m.value} <span className="text-xs font-normal text-gray-400">{m.sub}</span>
                  </p>
                </div>
                <div className={`text-right text-sm font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                  <p className="flex items-center justify-end gap-1">
                    {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(m.change)}%
                  </p>
                  <p className="text-xs font-normal text-gray-400">YoY</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Card>
  );
}
