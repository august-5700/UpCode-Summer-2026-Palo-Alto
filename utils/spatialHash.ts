import { HeatLatLngTuple } from "leaflet";

/**
 * Uniform-grid spatial hash over [lat, lng] points, in degree space.
 * Same as before, plus queryWithinRadius for kernel smoothing.
 */

export interface Neighbor {
    pt: HeatLatLngTuple;
    dist: number; // degrees
}

export interface SpatialHash {
    cellSize: number;
    cells: Map<string, HeatLatLngTuple[]>;
    maxRings: number;
}

const keyOf = (row: number, col: number) => `${row}|${col}`;

export function estimateCellSize(data: HeatLatLngTuple[]): number {
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    for (const [lat, lng] of data) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
    }
    const h = Math.max(maxLat - minLat, 1e-6);
    const w = Math.max(maxLng - minLng, 1e-6);
    return Math.sqrt((h * w * 2) / data.length);
}

/** O(N). Build once per data load, query many times. */
export function buildSpatialHash(
    data: HeatLatLngTuple[],
    cellSize: number = estimateCellSize(data),
): SpatialHash {
    const cells = new Map<string, HeatLatLngTuple[]>();

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    for (const pt of data) {
        const row = Math.floor(pt[0] / cellSize);
        const col = Math.floor(pt[1] / cellSize);
        const key = keyOf(row, col);
        let bucket = cells.get(key);
        if (!bucket) cells.set(key, (bucket = []));
        bucket.push(pt);

        if (pt[0] < minLat) minLat = pt[0];
        if (pt[0] > maxLat) maxLat = pt[0];
        if (pt[1] < minLng) minLng = pt[1];
        if (pt[1] > maxLng) maxLng = pt[1];
    }

    const extent = Math.max(maxLat - minLat, maxLng - minLng, cellSize);
    const maxRings = Math.ceil(extent / cellSize) + 1;

    return { cellSize, cells, maxRings };
}

/**
 * All points within `radius` degrees of (lat, lng), with distances.
 * Scans only the cells overlapping the radius footprint, so cost tracks
 * local density, not total N. Order is arbitrary (kernel sums don't care).
 */
export function queryWithinRadius(
    hash: SpatialHash,
    lat: number,
    lng: number,
    radius: number,
): Neighbor[] {
    const { cellSize, cells } = hash;
    const r = Math.ceil(radius / cellSize);
    const row0 = Math.floor(lat / cellSize);
    const col0 = Math.floor(lng / cellSize);
    const out: Neighbor[] = [];

    for (let row = row0 - r; row <= row0 + r; row++) {
        for (let col = col0 - r; col <= col0 + r; col++) {
            const bucket = cells.get(keyOf(row, col));
            if (!bucket) continue;
            for (const pt of bucket) {
                const d = Math.hypot(pt[0] - lat, pt[1] - lng);
                if (d <= radius) out.push({ pt, dist: d });
            }
        }
    }
    return out;
}

/**
 * k nearest neighbors via ring expansion (unchanged; still used by the
 * hover lookup and as the sparse-area fallback in kernel smoothing).
 */
export function queryKNearest(
    hash: SpatialHash,
    lat: number,
    lng: number,
    k: number,
): Neighbor[] {
    const { cellSize, cells, maxRings } = hash;
    const row0 = Math.floor(lat / cellSize);
    const col0 = Math.floor(lng / cellSize);

    const best: Neighbor[] = [];

    const consider = (pt: HeatLatLngTuple) => {
        const d = Math.hypot(pt[0] - lat, pt[1] - lng);
        if (best.length < k) {
            best.push({ pt, dist: d });
            best.sort((a, b) => a.dist - b.dist);
        } else if (d < best[best.length - 1].dist) {
            best[best.length - 1] = { pt, dist: d };
            best.sort((a, b) => a.dist - b.dist);
        }
    };

    const scanCell = (row: number, col: number) => {
        const bucket = cells.get(keyOf(row, col));
        if (bucket) for (const pt of bucket) consider(pt);
    };

    for (let r = 0; r <= maxRings; r++) {
        if (best.length === k && (r - 1) * cellSize > best[best.length - 1].dist) {
            break;
        }
        if (r === 0) {
            scanCell(row0, col0);
        } else {
            for (let col = col0 - r; col <= col0 + r; col++) {
                scanCell(row0 - r, col);
                scanCell(row0 + r, col);
            }
            for (let row = row0 - r + 1; row <= row0 + r - 1; row++) {
                scanCell(row, col0 - r);
                scanCell(row, col0 + r);
            }
        }
    }

    return best;
}