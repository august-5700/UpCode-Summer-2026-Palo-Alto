import { Map } from "leaflet";

export default function determineCursor(map: Map | null): 'default' | 'dragging' {
    if (map) {
        if (map.dragging) {
            return 'dragging'
        } else return 'default'
    } else return 'default'
}