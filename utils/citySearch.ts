import { LatLngTuple } from "leaflet";
import { STATE_ABBR } from "@/utils/stateCodeDict";
// generatingPoints function

/*def getCities(leftTop,rightBottom,horizontal,vertical):
    lists = []
    center = [(leftTop[0] + rightBottom[0]) / 2, (leftTop[1] + rightBottom[1]) / 2]
    for i in range(horizontal):
        for j in range(vertical):
            xCoor = leftTop[0] + (i + 0.5) * (rightBottom[0] - leftTop[0]) / horizontal
            yCoor = leftTop[1] + (j + 0.5) * (rightBottom[1] - leftTop[1]) / vertical
            lists.append([xCoor, yCoor, math.dist(center, [xCoor, yCoor])])
       return (lists.sort(key=lambda x: math.dist(center, x)))
    */

function getPoints(bottomLeft: LatLngTuple, topRight: LatLngTuple, horizontal: number, vertical: number): LatLngTuple[] {
    const lists: LatLngTuple[] = []
    const center = [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2]
    for (let i = 0; i < horizontal; i ++){
        for (let j = 0; j < vertical; j ++){
            const xCoor = bottomLeft[0] + (i + 0.5) * (topRight[0] - bottomLeft[0]) / horizontal
            const yCoor = bottomLeft[1] + (j + 0.5) * (topRight[1] - bottomLeft[1]) / vertical
            lists.push([xCoor, yCoor])
            // Math.sqrt(Math.pow(center[0] - xCoor, 2) + Math.pow(center[1] - yCoor, 2)

        }
    }
    return lists.sort((a, b) => Math.sqrt(Math.pow(center[0] - a[0], 2) + Math.pow(center[1] - a[1], 2)) - Math.sqrt(Math.pow(center[0] - b[0], 2) + Math.pow(center[1] - b[1], 2)))
}

export default async function citySearch(bottomLeft: LatLngTuple, topRight: LatLngTuple):Promise<[string, string][]> {
    const points = getPoints(bottomLeft, topRight, 5, 5)
    //console.log("Center: ", [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2],"Test Points: ", testPoints)
    // console.log("Point: ", [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2])
    //for (const point of testPoints) {
        //console.log("Point: ", [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2])
    //}
    let seenAddresses:[string, string][] = [];
   
    
    console.log("NOT TESTED")
    //const points = [[(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2]];
    const radius = 100
    //let addresses:[string, string][] = [];
    console.log("Points ," ,points)
    for(const latLngs of points){
        const url = `https://photon.komoot.io/reverse?lon=${latLngs[1]}&lat=${latLngs[0]}&radius=${radius}&layer=city&limit=1`
        
        try {
            console.log(url)
            const response = await fetch(url)
            const data = await response.json()
            //console.log(bottomLeft, topRight)
            console.log('searched with ', latLngs[1], latLngs[0], 'got point at ', data.features[0].geometry.coordinates[0], data.features[0].geometry.coordinates[1])

            const focused = data['features']['0']['properties']
            
            const city = focused['name']
            const state = STATE_ABBR[focused["state"]]
            console.log('city: ', city, 'state: ', state)
            if (!(seenAddresses.includes([city,state]))){
                seenAddresses.push([city, state])
            }
            //addresses.push([city, state])
            if (seenAddresses.length >= 5){
                break
            }
        }
        catch (e) {
            console.error(e)
        }
    }
    console.log("seenAddresses: ", seenAddresses)
    return seenAddresses
}