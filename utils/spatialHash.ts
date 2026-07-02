import { HeatLatLngTuple } from "leaflet";

/**
 * Uniform-grid spatial hash over [lat, lng] points, in degree space.
 *
 * Degree space matches the existing dist2D() metric (plain 2D euclidean on
 * lat/lng), so results are identical to the old findClosestNPoints path —
 * just without the O(N)-per-query scan. Note the shared caveat: a degree of
 * longitude shrinks with latitude, so "nearest" is slightly stretched E-W at
 * high latitudes. Same behavior as before, now documented.
 */

export interface Neighbor {
    pt: HeatLatLngTuple;
    dist: number; // degrees
}

export interface SpatialHash {
    cellSize: number;
    cells: Map<string, HeatLatLngTuple[]>;
    /** rings needed to cover the full data extent — termination bound for sparse queries */
    maxRings: number;
}

const keyOf = (row: number, col: number) => `${row}|${col}`;

/**
 * Pick a cell size targeting ~2 points per occupied cell, from the data's
 * bounding box. Good default; override if you profile something better.
 */
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
 * k nearest neighbors via ring expansion.
 *
 * Ring 0 is the query's own cell; ring r is the perimeter of the
 * (2r+1)x(2r+1) block around it. Any point in ring r is at least
 * (r-1)*cellSize away, so once we hold k candidates whose worst distance
 * beats that bound, no further ring can improve the answer and we stop.
 * Typical cost: 1-2 rings ≈ a handful of points, regardless of N.
 *
 * Returns neighbors sorted nearest-first, with distances included so the
 * caller doesn't recompute them. Returns fewer than k if the dataset is
 * smaller than k.
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

    const best: Neighbor[] = []; // kept sorted ascending; k is tiny (~3)

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
        // Prune: nothing in ring r (or beyond) can beat our current k-th best.
        if (best.length === k && (r - 1) * cellSize > best[best.length - 1].dist) {
            break;
        }

        if (r === 0) {
            scanCell(row0, col0);
        } else {
            // top and bottom edges of the ring
            for (let col = col0 - r; col <= col0 + r; col++) {
                scanCell(row0 - r, col);
                scanCell(row0 + r, col);
            }
            // left and right edges, excluding corners already scanned
            for (let row = row0 - r + 1; row <= row0 + r - 1; row++) {
                scanCell(row, col0 - r);
                scanCell(row, col0 + r);
            }
        }
    }

    return best;
}