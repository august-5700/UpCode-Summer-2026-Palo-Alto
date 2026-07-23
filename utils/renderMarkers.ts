import L from "leaflet";
import { Map as MapType } from "leaflet";
import { MarkerType } from "./types";

const defaultColor = "#2563eb";
const defaultFillColor = "#60a5fa";
const highlightedFillColor = "#facc15";

export const renderMarkers = (
    points: MarkerType[],
    map: MapType,
    markerLayerRef: { current: L.LayerGroup | null }
) => {
    if (!map) return;

    if (!markerLayerRef.current) {
        markerLayerRef.current = L.layerGroup().addTo(map);
    }

    const layer = markerLayerRef.current;

    layer.clearLayers();

    for (const point of points) {
        if (point.lat == null || point.lng == null) continue;

        if (point.highlighted) {
            layer.addLayer(
                L.marker([point.lat, point.lng], {
                    icon: L.divIcon({
                    className: "",
                    html: `
                        <img
                        src="/map-pin.svg"
                        width="28"
                        height="28"
                        draggable="false"
                        />
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [15, 35],
                    }),
                })
            );
        } else {
            layer.addLayer(
            L.circleMarker([point.lat, point.lng], {
                radius: 4,
                color: defaultColor,
                fillColor: defaultFillColor,
                fillOpacity: 0.75,
                weight: 1,
            })
            );
        }
    }
};