import { HeatLatLngTuple } from "leaflet";

function dist(pt1: [number, number], pt2: [number, number]): number {
    return Math.sqrt(
        (pt1[0] - pt2[0]) ** 2 +
        (pt1[1] - pt2[1]) ** 2
    );
}

function toLatLng(tuple: HeatLatLngTuple): [number, number] {
    return [tuple[0], tuple[1]];
}

export default function findClosestNPoints(
    targetPoint: [number, number],
    data: HeatLatLngTuple[],
    n: number = 1,
): HeatLatLngTuple[] {
    if (data.length === 0) throw new Error("findClosestNPoints: empty data");
    if (n <= 0) return [];
    n = Math.min(n, data.length);

    // Binary search for the boundary by index 0 (lat) — data must be sorted by it.
    let left = 0;
    let right = data.length - 1;
    let mid = 0;
    while (left <= right) {
        mid = Math.floor((left + right) / 2);
        if (data[mid][0] < targetPoint[0]) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    // Top-n, kept sorted ascending by distance.
    const results: { pt: HeatLatLngTuple; d: number }[] = [];

    const consider = (pt: HeatLatLngTuple) => {
        const d = dist(targetPoint, toLatLng(pt));
        if (results.length < n) {
            let i = results.length;
            while (i > 0 && results[i - 1].d > d) i--;
            results.splice(i, 0, { pt, d });
        } else if (d < results[n - 1].d) {
            results.pop();                       // drop current worst
            let i = results.length;
            while (i > 0 && results[i - 1].d > d) i--;
            results.splice(i, 0, { pt, d });
        }
    };

    // Prune a side once its x-gap alone exceeds the n-th best distance.
    const bound = () => (results.length < n ? Infinity : results[n - 1].d);

    let low = mid;         // include data[mid] on the left sweep
    let high = mid + 1;
    let leftDone = false;
    let rightDone = false;

    while (true) {
        if (!leftDone) {
            if (low < 0) {
                leftDone = true;
            } else {
                const pL = data[low];
                consider(pL);
                if (Math.abs(targetPoint[0] - pL[0]) > bound()) leftDone = true;
                low -= 1;
            }
        }

        if (!rightDone) {
            if (high >= data.length) {           // correct bound (was `high >= 0`)
                rightDone = true;
            } else {
                const pH = data[high];
                consider(pH);
                if (Math.abs(targetPoint[0] - pH[0]) > bound()) rightDone = true;
                high += 1;
            }
        }

        if (leftDone && rightDone) break;
    }

    return results.map((r) => r.pt);   // sorted nearest-first
}