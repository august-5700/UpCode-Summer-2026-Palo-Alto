"use client";

import { useState, type ReactNode } from "react";
import { Filter, DollarSign, BedDouble, Percent, CalendarClock } from "lucide-react";
import MinSlider from "./min-slider";

const money = (v: number) =>
    v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(1)}M`
        : v >= 1_000
          ? `$${Math.round(v / 1_000)}k`
          : `$${v}`;

export const MAX_PRICE = 2_000_000;
export const MAX_DOM = 365;

export type ListingFilterValues = {
    minPrice: number;
    maxPrice: number;
    minBeds: number;
    minYield: number;
    maxDaysOnMarket: number;
};

export const DEFAULT_FILTER_VALUES: ListingFilterValues = {
    minPrice: 0,
    maxPrice: MAX_PRICE,
    minBeds: 0,
    minYield: 0,
    maxDaysOnMarket: MAX_DOM,
};

interface FiltersProps {
    value: ListingFilterValues;
    onChange: (next: ListingFilterValues) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-600">{label}</p>
            {children}
        </div>
    );
}

export default function Filters({ value, onChange }: FiltersProps) {
    const [open, setOpen] = useState(false);

    const set = (k: keyof ListingFilterValues) => (v: number) =>
        onChange({ ...value, [k]: v });

    return (
        <>
            {open && (
                <div className="absolute top-4 left-72 z-100 w-80 overflow-hidden rounded-3xl border border-white/40 bg-white/50 shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
                    <div className="flex h-11 items-center pl-16 pr-4">
                        <p className="text-sm font-semibold text-gray-800">Filter listings</p>
                    </div>

                    <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
                        <Row label="Min price">
                            <MinSlider
                                icon={DollarSign}
                                value={value.minPrice}
                                onChange={set("minPrice")}
                                min={0}
                                max={MAX_PRICE}
                                step={10_000}
                                format={money}
                            />
                        </Row>

                        <Row label="Max price">
                            <MinSlider
                                icon={DollarSign}
                                value={value.maxPrice}
                                onChange={set("maxPrice")}
                                min={0}
                                max={MAX_PRICE}
                                step={10_000}
                                format={money}
                            />
                        </Row>

                        <Row label="Min beds">
                            <MinSlider
                                icon={BedDouble}
                                value={value.minBeds}
                                onChange={set("minBeds")}
                                min={0}
                                max={6}
                                step={1}
                                format={(v) => (v === 0 ? "Any" : `${v}+`)}
                            />
                        </Row>

                        <Row label="Min gross yield">
                            <MinSlider
                                icon={Percent}
                                value={value.minYield}
                                onChange={set("minYield")}
                                min={0}
                                max={15}
                                step={0.5}
                                format={(v) => `${v.toFixed(1)}%`}
                            />
                        </Row>

                        <Row label="Max days on market">
                            <MinSlider
                                icon={CalendarClock}
                                value={value.maxDaysOnMarket}
                                onChange={set("maxDaysOnMarket")}
                                min={0}
                                max={MAX_DOM}
                                step={5}
                                format={(v) => (v >= MAX_DOM ? "Any" : `${v}d`)}
                            />
                        </Row>
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="absolute top-4 left-72 z-101 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/50 shadow-lg backdrop-blur-2xl backdrop-saturate-150 transition hover:bg-white/70"
            >
                <Filter className="h-5 w-5 text-gray-800" />
            </button>
        </>
    );
}
