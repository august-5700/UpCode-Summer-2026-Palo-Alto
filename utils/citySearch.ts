import { LatLngTuple } from "leaflet";
import { STATE_ABBR } from "@/utils/stateCodeDict";
// generatingPoints function
export default async function citySearch(bottomLeft: LatLngTuple, topRight: LatLngTuple):Promise<[string, string][]> {
    const testPoints = [generatingPoints(bottomLeft, topRight, 5, 5)]
    console.log("Test Points: ", testPoints)
    const points = [[(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2]];
    const radius = 100
    let addresses:[string, string][] = [];

    for(const latLngs of points){
        const url = `https://photon.komoot.io/reverse?lon=${latLngs[1]}&lat=${latLngs[0]}&radius=${radius}&layer=city&limit=1`
        
        try {
            const response = await fetch(url)
            const data = await response.json()
            console.log(bottomLeft, topRight)
            console.log('searched with ', latLngs[1], latLngs[0], 'got point at ', data.features[0].geometry.coordinates[0], data.features[0].geometry.coordinates[1])

            const focused = data['features']['0']['properties']
            
            const city = focused['name']
            const state = STATE_ABBR[focused["state"]]
            console.log('city: ', city, 'state: ', state)
            addresses.push([city, state])
        }
        catch (e) {
            console.error(e)
        }
    }
    return addresses
}