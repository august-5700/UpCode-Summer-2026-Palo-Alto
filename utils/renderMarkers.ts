import L from "leaflet";
import { Map as MapType } from "leaflet";

export const renderMarkers = (
    points: Point[],
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

        layer.addLayer(
            L.circleMarker([point.lat, point.lng], {
                radius: 3,
                color: "#2563eb",
                fillColor: "#60a5fa",
                fillOpacity: 0.75,
                weight: 1,
            })
        );
    }
};