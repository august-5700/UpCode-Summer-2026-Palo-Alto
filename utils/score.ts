/**
 * HeatMap Score, 0-10, from the data we have.
 * gross rental yield (annual rent / home value), weighted 60%
 * occupancy rate (occupied / total units), weighted 40%
 * and it returns null when there isn't enough data (missing home value or rent)
 */




export function computeHeatSimple(
  medianHomeValue: number | string | null | undefined,
  medianGrossRent: number | string | null | undefined,
): number | null {
  const clean = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  const home = clean(medianHomeValue);
  const rent = clean(medianGrossRent);

  // not enough data for a meaningful score, caller renders N/A
  if (!home || !rent) return null;

  const parts: { value: number; weight: number }[] = [];

  // rental yield component, 0-10 where 8% gross yield maps to 10
  const yieldPct = ((rent * 12) / home) * 100;
  parts.push({ value: clamp((yieldPct / 8) * 10, 0, 10), weight: 0.6 });



  const w = parts.reduce((s, p) => s + p.weight, 0);
  return Number((parts.reduce((s, p) => s + p.value * p.weight, 0) / w).toFixed(1));
}


export function computeHeatScore(
  medianHomeValue: number | string | null | undefined,
  medianGrossRent: number | string | null | undefined,
  totalHousingUnits: number | string | null | undefined,
  occupiedUnits: number | string | null | undefined
): number | null {
  const clean = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  const home = clean(medianHomeValue);
  const rent = clean(medianGrossRent);
  const total = clean(totalHousingUnits);
  const occupied = clean(occupiedUnits);

  // not enough data for a meaningful score, caller renders N/A
  if (!home || !rent) return null;

  const parts: { value: number; weight: number }[] = [];

  // rental yield component, 0-10 where 8% gross yield maps to 10
  const yieldPct = ((rent * 12) / home) * 100;
  parts.push({ value: clamp((yieldPct / 8) * 10, 0, 10), weight: 0.6 });

  // occupancy component, 0-10 where 70% maps to 0 and 98%+ maps to 10
  if (total && occupied != null) {
    const occ = occupied / total;
    parts.push({ value: clamp(((occ - 0.7) / (0.98 - 0.7)) * 10, 0, 10), weight: 0.4 });
  }

  const w = parts.reduce((s, p) => s + p.weight, 0);
  return Number((parts.reduce((s, p) => s + p.value * p.weight, 0) / w).toFixed(1));
}
