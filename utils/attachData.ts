import { HeatLatLngTuple, LatLngTuple } from "leaflet";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { Feature, MultiPolygon, Polygon } from "geojson";
import usaData from "@/data/usa.json";
import findClosestNPoints from "./findClosestNPoints";

const usa = usaData as Feature<Polygon | MultiPolygon>;

/**
 * Attach intensity data to a bare lattice.
 *
 * For each grid point, finds the nearest point in `data` and copies its
 * intensity. Optionally drops points that fall outside the USA polygon.
 *
 * NOTE: findClosestPoint uses a binary search over index-0, so `data` MUST be
 * sorted by its first coordinate (lat) for correct results.
 *
 * @param grid    output of generateTriangleGrid (lat/lng only)
 * @param data    source points as [lat, lng, intensity], sorted by lat
 * @param clipToUsa  if true, exclude points outside the USA polygon
 */
export function attachData(
    grid: LatLngTuple[],
    data: HeatLatLngTuple[],
    clipToUsa: boolean = true,
): HeatLatLngTuple[] {
    const out: HeatLatLngTuple[] = [];

    for (const [lat, lng] of grid) {
        if (clipToUsa && !booleanPointInPolygon(point([lng, lat]), usa)) {
            continue;
        }

        const closest = findClosestNPoints([lat, lng], data)[0];
        const intensity = closest[2];

        out.push([lat, lng, intensity]);
    }

    return out;
}

function dist2D(a: [number, number], b: [number, number]): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export type WeightedPoint = [number, number, number, number];

export function attachWeightedData(
    grid: LatLngTuple[],
    data: HeatLatLngTuple[],
    clipToUsa: boolean = true,
    confidenceScale: number = 0.5,   // distance (in degrees) at which confidence ≈ 0.37
): WeightedPoint[] {
    const out: WeightedPoint[] = [];

    for (const [lat, lng] of grid) {
        if (clipToUsa && !booleanPointInPolygon(point([lng, lat]), usa)) {
            continue;
        }

        const neighbors = findClosestNPoints([lat, lng], data, 3);

        // Inverse-distance-weighted value.
        let wSum = 0;
        let vSum = 0;
        let nearest = Infinity;

        for (const nb of neighbors) {
            const d = dist2D([lat, lng], [nb[0], nb[1]]);
            if (d < nearest) nearest = d;

            const w = 1 / (d * d + 1e-12);
            wSum += w;
            vSum += w * nb[2];
        }

        const value = wSum > 0 ? vSum / wSum : 0;
        const confidence = Math.exp(-nearest / confidenceScale);

        out.push([lat, lng, value, confidence]);
    }

    return out;
}