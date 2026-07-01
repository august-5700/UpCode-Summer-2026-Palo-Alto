import L from 'leaflet';

const R = 6378137;

export function heatRadiusForZoom(
    map: L.Map,
    spacing: number,
    zoom: number = map.getZoom(),
    factor: number = 0.9,
): number {
    const lngDelta = (spacing / R) * (180 / Math.PI);
    const p0 = map.project([0, 0], zoom);
    const p1 = map.project([0, lngDelta], zoom);
    const pxSpacing = Math.abs(p1.x - p0.x);
    return factor * pxSpacing;
}