import { LatLngTuple } from "leaflet";

const R = 6378137; // Web Mercator sphere radius (EPSG:3857)

function latLngToMercator(lat: number, lng: number): [number, number] {
    const x = R * (lng * Math.PI / 180);
    const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
    return [x, y];
}

function mercatorToLatLng(x: number, y: number): LatLngTuple {
    const lng = (x / R) * (180 / Math.PI);
    const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
    return [lat, lng];
}

/**
 * Generate an equilateral-triangle lattice that is evenly spaced ON SCREEN
 * (uniform in Web Mercator), covering the box from bottomLeft to topRight.
 *
 * @param length spacing between adjacent points, in meters measured at the
 *               equator (= Mercator units). Real-world distances vary with
 *               latitude; on-screen spacing stays uniform.
 */
export function generateTriangleGrid(
    bottomLeft: LatLngTuple,
    topRight: LatLngTuple,
    length: number,
): LatLngTuple[] {
    const grid: LatLngTuple[] = [];

    const [minX, minY] = latLngToMercator(bottomLeft[0], bottomLeft[1]);
    const [maxX, maxY] = latLngToMercator(topRight[0], topRight[1]);

    const dx = length;                      // horizontal step within a row
    const dy = length * Math.sqrt(3) / 2;   // vertical step between rows

    let row = 0;
    for (let y = minY; y <= maxY; y += dy, row++) {
        const xOffset = (row % 2) * (dx / 2); // stagger odd rows -> equilateral
        for (let x = minX + xOffset; x <= maxX; x += dx) {
            grid.push(mercatorToLatLng(x, y));
        }
    }

    return grid;
}