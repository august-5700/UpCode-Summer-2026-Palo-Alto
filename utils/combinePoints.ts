import { HeatLatLngTuple } from "leaflet";
import type { WeightedPoint } from "./attachData";

export function combinePoints(
    points: WeightedPoint[],
    combine: (value: number, confidence: number) => number =
        (value, confidence) => value * confidence,
): HeatLatLngTuple[] {
    return points.map(
        ([lat, lng, value, confidence]) => [lat, lng, combine(value, confidence)],
    );
}