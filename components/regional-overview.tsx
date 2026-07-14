"use client";

import { TractData } from "@/utils/api";

interface RegionalOverviewProps {
    data: TractData
}

export default function RegionalOverview({data}: RegionalOverviewProps){
    return (
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
    )
}

