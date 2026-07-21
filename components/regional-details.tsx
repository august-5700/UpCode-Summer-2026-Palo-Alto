"use client";

import { TractData } from "@/utils/types";
import { Building2, DollarSign, Home } from "lucide-react";

interface RegionalDetailsProps {
    data: TractData
}

const ICONS = { home: Home, dollar: DollarSign, building: Building2 } as const;


export default function RegionalDetails({data}: RegionalDetailsProps){
    return (
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
    )
}

