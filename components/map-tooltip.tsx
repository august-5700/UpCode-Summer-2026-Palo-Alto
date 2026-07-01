"use client";

import { Home, DollarSign, TrendingUp } from "lucide-react";
import { computeHeatScore } from "@/utils/api";

const money = (v: number) =>
  Number.isFinite(v) && v > 0 ? "$" + Math.round(v).toLocaleString() : "N/A";

export default function MapTooltip({ block, x, y }: { block: any; x: number; y: number }) {
  const home = Number(block.median_home_value);
  const rent = Number(block.median_gross_rent);
  const grossYield = home > 0 && rent > 0 ? ((rent * 12) / home) * 100 : null;

  const score = computeHeatScore(
    block.median_home_value,
    block.median_gross_rent,
    block.total_housing_units,
    block.occupied_units
  );
  const badge = score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-amber-500" : "bg-red-500";

  const rows = [
    { icon: Home, tint: "bg-emerald-100 text-emerald-700", label: "Median Home Value", value: money(home) },
    { icon: DollarSign, tint: "bg-indigo-100 text-indigo-700", label: "Median Rent", value: rent > 0 ? `${money(rent)}/mo` : "N/A" },
    { icon: TrendingUp, tint: "bg-violet-100 text-violet-700", label: "Gross Yield", value: grossYield != null ? `${grossYield.toFixed(1)}%` : "N/A" },
  ];


  
  return (
    <div
      className="pointer-events-none fixed z-[1100] w-72 rounded-2xl border border-gray-100 bg-white/95 p-4 shadow-xl backdrop-blur"
      style={{ left: x + 16, top: y + 16 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight text-gray-900">Tract {block.tract_code ?? "—"}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold text-white ${badge}`}>{score.toFixed(1)}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.label} className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${r.tint}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{r.label}</p>
                <p className="font-bold leading-tight text-gray-900">{r.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
