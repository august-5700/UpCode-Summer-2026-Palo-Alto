import { LatLngTuple } from "leaflet";
import { STATE_ABBR } from "@/utils/stateCodeDict";

export default async function citySearch(bottomLeft: LatLngTuple, topRight: LatLngTuple) {
    const points = [[(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2]];
    const radius = 100
    var addresses = [];

    for(const latLngs of points){
        const url = `https://photon.komoot.io/reverse?lon=${latLngs[1]}&lat=${latLngs[0]}&radius=${radius}&layer=city&limit=1`
        
        try {
            const response = await fetch(url)
            const data = await response.json()

            const focused = data['features']['0']['properties']
            
            const city = focused['name']
            const state = STATE_ABBR[focused["state"]]
            addresses.push([city, state])
        }
        catch{
            return Error
        }
    }
    return addresses
}