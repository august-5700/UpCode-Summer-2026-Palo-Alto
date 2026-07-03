import { HeatLatLngTuple, LatLngTuple } from "leaflet";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { Feature, MultiPolygon, Polygon } from "geojson";
import usaData from "@/data/usa.json";
import {
    buildSpatialHash,
    queryWithinRadius,
    queryKNearest,
} from "./spatialHash";

// Accept Feature, FeatureCollection, or bare geometry — merge to one MultiPolygon.
const usa: Feature<Polygon | MultiPolygon> = (() => {
    const d = usaData as any;
    if (d.type === "Feature") return d;
    if (d.type === "FeatureCollection") {
        const coords: any[] = [];
        for (const f of d.features) {
            const g = f.geometry;
            if (!g) continue;
            if (g.type === "Polygon") coords.push(g.coordinates);
            else if (g.type === "MultiPolygon") coords.push(...g.coordinates);
        }
        return {
            type: "Feature",
            properties: {},
            geometry: { type: "MultiPolygon", coordinates: coords },
        };
    }
    return { type: "Feature", properties: {}, geometry: d };
})();

/** USA bbox for the cheap pre-reject before the full polygon test. */
const USA_BBOX = (() => {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    const walk = (coords: any) => {
        if (typeof coords[0] === "number") {
            const [lng, lat] = coords;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
        } else {
            for (const c of coords) walk(c);
        }
    };
    walk(usa.geometry.coordinates);
    return { minLat, maxLat, minLng, maxLng };
})();

const insideUsa = (lat: number, lng: number): boolean => {
    if (
        lat < USA_BBOX.minLat || lat > USA_BBOX.maxLat ||
        lng < USA_BBOX.minLng || lng > USA_BBOX.maxLng
    ) {
        return false;
    }
    return booleanPointInPolygon(point([lng, lat]), usa);
};

export type WeightedPoint = [number, number, number, number];

/**
 * Gaussian kernel smoothing (Nadaraya-Watson), replacing k-NN IDW.
 *
 * Each grid point averages ALL data points within 3 bandwidths, weighted
 * by exp(-d^2 / 2h^2). Compared to IDW this is seam-free (no neighbor-set
 * discontinuities), averages out single-tract noise, and has one
 * meaningful knob: the bandwidth h.
 *
 * Signature is unchanged except the 4th param: `bandwidth` (degrees)
 * replaces `confidenceScale`. If omitted, it defaults to the hash cell
 * size, which tracks the typical spacing of the current dataset — so it
 * adapts automatically when you switch between counties and blocks.
 *
 * Confidence is now total kernel mass (effective local sample size)
 * squashed to (0, 1): near 0 when a grid point is extrapolating from one
 * far-away neighbor, near 1 when it sits in dense data.
 *
 * Values remain a convex combination of inputs, so [0,1]-normalized
 * intensities stay in [0,1].
 */
export function attachWeightedData(
    grid: LatLngTuple[],
    data: HeatLatLngTuple[],
    clipToUsa: boolean = true,
    bandwidth?: number,
): WeightedPoint[] {
    if (data.length === 0) return [];

    const hash = buildSpatialHash(data);
    const h = bandwidth ?? hash.cellSize;
    const cutoff = 3 * h; // beyond 3h the Gaussian weight is ~0.01
    const inv2h2 = 1 / (2 * h * h);

    const out: WeightedPoint[] = [];

    for (const [lat, lng] of grid) {
        if (clipToUsa && !insideUsa(lat, lng)) continue;

        let neighbors = queryWithinRadius(hash, lat, lng, cutoff);

        // Sparse-area fallback: nothing within 3h -> lean on the single
        // nearest point (with the tiny weight the kernel assigns it), so
        // rural areas render instead of leaving holes. Confidence will be
        // near zero there, which is exactly right.
        if (neighbors.length === 0) {
            neighbors = queryKNearest(hash, lat, lng, 1);
            if (neighbors.length === 0) continue;
        }

        let wSum = 0;
        let vSum = 0;
        for (const { pt, dist } of neighbors) {
            const w = Math.exp(-dist * dist * inv2h2);
            wSum += w;
            vSum += w * pt[2];
        }

        if (wSum <= 0) continue;
        const value = vSum / wSum;
        const confidence = 1 - Math.exp(-wSum);

        out.push([lat, lng, value, confidence]);
    }

    return out;
}

/**
 * attachData: nearest-1 intensity copy (unchanged behavior, hash-backed).
 */
export function attachData(
    grid: LatLngTuple[],
    data: HeatLatLngTuple[],
    clipToUsa: boolean = true,
): HeatLatLngTuple[] {
    if (data.length === 0) return [];

    const hash = buildSpatialHash(data);
    const out: HeatLatLngTuple[] = [];

    for (const [lat, lng] of grid) {
        if (clipToUsa && !insideUsa(lat, lng)) continue;

        const nearest = queryKNearest(hash, lat, lng, 1)[0];
        if (!nearest) continue;

        out.push([lat, lng, nearest.pt[2]]);
    }

    return out;
}