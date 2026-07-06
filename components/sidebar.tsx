"use client";

import { X, Home, DollarSign, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TractData } from "@/utils/api";

const ICONS = { home: Home, dollar: DollarSign, building: Building2 } as const;

export default function Sidebar({ data, onClose }: { data: TractData; onClose: () => void }) {
  return (
    <Card className="absolute right-4 top-4 bottom-4 z-[1000] flex w-[420px] flex-col gap-6 overflow-y-auto rounded-3xl border border-white/40 bg-white/50 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{data.title}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="-mr-2 -mt-1 rounded-full text-gray-400 hover:text-gray-900"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Score */}
      <section className="flex flex-col items-center">
        <p className="self-start text-xs font-semibold uppercase tracking-wider text-gray-500">
          HeatMap Score
        </p>
        {data.score == null ? (
          <p className="mt-1 text-6xl font-extrabold leading-none text-gray-300">N/A</p>
        ) : (
          <p className="mt-1 flex items-baseline gap-1 font-extrabold leading-none text-green-600">
            <span className="text-7xl">{data.score.toFixed(1)}</span>
            <span className="text-2xl text-gray-300">/10</span>
          </p>
        )}

        {/* Percentiles (only when available) */}
        {data.regional != null && data.national != null && (
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
        )}

        {/* progress bar filled up to the score */}
        <div className="relative mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          {data.score != null && data.score > 0 && (
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
              style={{ width: `${data.score * 10}%` }}
            >
              <div
                className="h-full bg-[linear-gradient(to_right,#ef4444,#f59e0b,#eab308,#22c55e,#3b82f6)]"
                style={{ width: `${1000 / data.score}%` }}
              />
            </div>
          )}
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
            const Icon = ICONS[m.icon];
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
                    {m.value}
                    {m.sub ? <span className="text-xs font-normal text-gray-400"> {m.sub}</span> : null}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Card>
  );
}
