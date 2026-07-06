import { HeatLatLngTuple, LatLngTuple } from "leaflet";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { Feature, MultiPolygon, Polygon } from "geojson";
import usaData from "@/data/usa2.json";
import { buildSpatialHash, queryKNearest } from "./spatialHash";

// Accept Feature, FeatureCollection, or bare geometry — merge to one MultiPolygon.
const usa: Feature<Polygon | MultiPolygon> = (() => {
    const d = usaData as any;
    if (d.type === "Feature") return d;
    if (d.type === "FeatureCollection") {
        // Merge all polygon features into a single MultiPolygon
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
    // bare geometry object
    return { type: "Feature", properties: {}, geometry: d };
})();


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
        return false; // cheap reject, no polygon test
    }
    return booleanPointInPolygon(point([lng, lat]), usa);
};

export type WeightedPoint = [number, number, number, number];


export function attachWeightedData(
    grid: LatLngTuple[],
    data: HeatLatLngTuple[],
    clipToUsa: boolean = true,
    confidenceScale: number = 0.5, // degrees at which confidence ≈ 0.37
    k: number = 1,
): WeightedPoint[] {
    if (data.length === 0) return [];

    const hash = buildSpatialHash(data); // O(N), once per call
    const out: WeightedPoint[] = [];

    for (const [lat, lng] of grid) {
        if (clipToUsa && !insideUsa(lat, lng)) continue;

        const neighbors = queryKNearest(hash, lat, lng, k);
        if (neighbors.length === 0) continue;

        // Inverse-distance-weighted value; distances come back from the
        // query, so no recompute.
        let wSum = 0;
        let vSum = 0;

        for (const { pt, dist } of neighbors) {
            const w = 1 / (dist * dist + 1e-12);
            wSum += w;
            vSum += w * pt[2];
        }

        const value = wSum > 0 ? vSum / wSum : 0;
        const nearest = neighbors[0].dist; // sorted nearest-first
        const confidence = Math.exp(-nearest / confidenceScale);

        out.push([lat, lng, value, confidence]);
    }

    return out;
}

/**
 * Hash-backed attachData (nearest-1 intensity copy). Same signature as the
 * original; `data` need not be sorted.
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