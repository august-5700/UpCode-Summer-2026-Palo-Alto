import { HeatLatLngTuple, LatLngTuple } from "leaflet";
import { point } from "@turf/helpers";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { Feature, MultiPolygon, Polygon } from "geojson";
import usaData from '@/data/usa.json'
import findClosestPoint from "../findClosestPoint";

export async function generateTriangleGrid(
    startingPoint: LatLngTuple,
    endingPoint: LatLngTuple,
    center: LatLngTuple,
    length: number,
    data: HeatLatLngTuple[],
    // intensity: number
): Promise<HeatLatLngTuple[]> {

    const usa = usaData as Feature<Polygon | MultiPolygon>
    const grid: HeatLatLngTuple[] = [];

    const v1lat = startingPoint[0] - endingPoint[0];
    const v1lon = startingPoint[1] - endingPoint[1];

    const angle = Math.PI / 3;

    const v2lat = v1lat * Math.cos(angle) - v1lon * Math.sin(angle);
    const v2lon = v1lat * Math.sin(angle) + v1lon * Math.cos(angle);

    const hyp = Math.sqrt(v1lat ** 2 + v1lon ** 2);
    const limits = Math.floor(length / hyp) + 3;

    for (let i = -limits; i <= limits; i++) {

        for (let j = -limits; j <= limits; j++) {

            let lat = startingPoint[0] + j * v1lat;
            let lon = startingPoint[1] + j * v1lon;

            lat += i * v2lat;
            lon += i * v2lon;

            const pt = point([lon, lat]);
            const closestPoint = findClosestPoint([lat, lon], data);
            // console.log(closestPoint)
            const intensity = closestPoint[2]

            if (booleanPointInPolygon(pt, usa)) {
                grid.push([lat, lon, intensity]);
            } else {
                console.log('point in grid not within usa polygon')
            }
        }
    }

    return grid;
}