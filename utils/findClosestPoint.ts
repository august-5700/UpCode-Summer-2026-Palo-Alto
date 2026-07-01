import { HeatLatLngTuple, LatLngTuple } from "leaflet";

function dist(pt1:[number, number], pt2:[number, number]):number {
    return Math.sqrt(
        (
            (pt1[0] - pt2[0])
            ** 2
        )
         + 
         (
            (pt1[1] - pt2[1])
            ** 2
        )
    )
}

function convertHeatLatLngTupleToLatLngList(tuple: HeatLatLngTuple): [number, number] {
    return [tuple[0], tuple[1]]
}

export default function findClosestPoint(targetPoint: [number, number], data: HeatLatLngTuple[]):HeatLatLngTuple {
    let left = 0;
    let right = data.length - 1;
    let mid = 0

    while (left <= right) {
        mid = Math.round((left + right) / 2)
        let midPoint = data[mid]

        if (midPoint[0] < targetPoint[0]) {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }

    let closestPoint = data[mid]
    let closestDistance = dist(targetPoint, convertHeatLatLngTupleToLatLngList(closestPoint))
    let low = mid - 1
    let high = mid + 1
    let leftDone = false
    let rightDone = false

    while (true) {
        if (!leftDone) {

            let pL = null
            if (low >= 0) {
                pL = data[low]
            }

            if (!pL) {
                leftDone = true
            } else {
                let cDistance = dist(targetPoint, convertHeatLatLngTupleToLatLngList(pL))
                if (cDistance < closestDistance) {
                    closestPoint = pL
                    closestDistance = cDistance
                }

                if (Math.abs(targetPoint[0] - pL[0]) > closestDistance) {
                    leftDone = true
                }
                low -= 1
            }
        }

        if (!rightDone) {
            let pH = null
            if (high >= 0) {
                pH = data[high]
            }

            if (!pH) {
                rightDone = true
            } else {
                let cDistance = dist(targetPoint, convertHeatLatLngTupleToLatLngList(pH))
                if (cDistance < closestDistance) {
                    closestPoint = pH
                    closestDistance = cDistance
                }

                if (Math.abs(targetPoint[0] - pH[0]) > closestDistance) {
                    rightDone = true
                }
                high += 1
            }
        }

        if (leftDone && rightDone) {
            break
        }
    }

    return closestPoint
}
