export function pixelRadius(meters: number, map: L.Map){
    const lat = map.getCenter().lat;
    const metersPerPixel = 40075016.686 * Math.abs(Math.cos((lat * Math.PI) / 180)) / Math.pow(2, map.getZoom() + 8);
    return meters / metersPerPixel;
}