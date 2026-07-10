import L from "leaflet";

export async function renderCountyChoropleth(
  getColor: (feature: GeoJSON.Feature) => string
): Promise<L.GeoJSON> {
  const geojson = await fetch("/counties.json").then((r) => r.json());

  return L.geoJSON(geojson, {
    style: (feature) => ({
      fillColor: getColor(feature!),
      fillOpacity: 0.7,
      color: getColor(feature!),
      weight: 0.5,
      opacity: 1,
    }),
  });
}

export function valueToHex(
  value: number,
  min: number,
  max: number,
  startColor = "#00ff00",
  endColor = "#ff0000"
): string {
  if (value < 0){
    return '#becfd3'
  }
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string) {
  hex = hex.replace("#", "");

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}