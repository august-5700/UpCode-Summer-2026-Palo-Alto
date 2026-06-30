import { HeatLatLngTuple, LatLngTuple } from "leaflet";
import getCounties from "../api";

export default async function findClosestPoint(lat: number, lon: number): Promise<HeatLatLngTuple> {

    const points = await getCounties();
    const relevantPointValues:HeatLatLngTuple[] = points.map((pt:any)=>
        [pt.lat || 0, pt.long || 0, (pt.median_gross_rent || 1)/(pt.median_home_value || 1)]
    )

    let closestPointFound = false
    let closestPoint: HeatLatLngTuple = [0, 0, 0]
    let threshhold = 0
    while (!closestPointFound) {
        threshhold += 0.1
        console.log(threshhold)
        // console.log(relevantPointValues)
        closestPoint = relevantPointValues.filter((point:HeatLatLngTuple) => Math.abs(point[0] - lat) < threshhold && Math.abs(point[1] - lon) < threshhold)[0]
        if (closestPoint !== undefined) {
            closestPointFound = true
        }
    }

    return closestPoint
}