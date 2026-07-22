import { LatLngTuple } from "leaflet";
import { STATE_ABBR } from "@/utils/stateCodeDict";

const CITIES_TO_FETCH = 5;
const CANDIDATE_LIMIT = 50;   // fetch generously, then rank/trim ourselves
const MIN_RADIUS_KM = 2;      // floor: deep zoom still returns something
const MAX_RADIUS_KM = 500;    // cap: zoomed-out doesn't fetch half the country

// Higher = more prominent. Floats the real city above its suburbs.
const PLACE_RANK: Record<string, number> = {
  city: 5, borough: 4, town: 3, village: 2, hamlet: 1, suburb: 0,
};

const extentArea = (ext?: number[]) => {
  if (!ext || ext.length < 4) return 0;
  const [w, n, e, s] = ext;           // Photon extent = [west, north, east, south]
  return Math.abs(e - w) * Math.abs(n - s);
};

export default async function citySearch(
  bottomLeft: LatLngTuple,
  topRight: LatLngTuple
): Promise<[string, string][]> {
  const center: LatLngTuple = [
    (bottomLeft[0] + topRight[0]) / 2,
    (bottomLeft[1] + topRight[1]) / 2,
  ];

  // Normalize bounds so min/max are unambiguous
  const south = Math.min(bottomLeft[0], topRight[0]);
  const north = Math.max(bottomLeft[0], topRight[0]);
  const west  = Math.min(bottomLeft[1], topRight[1]);
  const east  = Math.max(bottomLeft[1], topRight[1]);

  const span = Math.max(north - south, east - west);
  const radius = Math.min(Math.max((span * 111) / 2, MIN_RADIUS_KM), MAX_RADIUS_KM);

  const url = `https://photon.komoot.io/reverse?lon=${center[1]}&lat=${center[0]}&radius=${radius}&layer=city&limit=${CANDIDATE_LIMIT}`;

  try {
    console.log(url);
    const response = await fetch(url);
    const data = await response.json();
    if (!data.features?.length) return [];

    const inBounds = (lat: number, lon: number) =>
      lat >= south && lat <= north && lon >= west && lon <= east;

    const candidates = data.features.map((f: any) => {
      const [lon, lat] = f.geometry.coordinates;
      const p = f.properties;
      return {
        city: p.name as string,
        state: STATE_ABBR[p.state] as string,
        rank: PLACE_RANK[p.osm_value] ?? 0,
        area: extentArea(p.extent),
        dist: (lat - center[0]) ** 2 + (lon - center[1]) ** 2,
        inBounds: inBounds(lat, lon),
      };
    });

    // Prefer what's actually on screen; fall back to all if none survive
    let pool = candidates.filter((c: any) => c.inBounds);
    if (pool.length === 0) pool = candidates;

    // Biggest footprint first, then place tag, then nearest to center
    pool.sort((a: any, b: any) => b.area - a.area || b.rank - a.rank || a.dist - b.dist);

    const seen: [string, string][] = [];
    for (const c of pool) {
      if (!c.city || !c.state) continue;
      if (seen.some(([city, st]) => city === c.city && st === c.state)) continue;
      seen.push([c.city, c.state]);
      if (seen.length >= CITIES_TO_FETCH) break;
    }

    console.log("seenAddresses: ", seen);
    return seen;
  } catch (e) {
    console.error(e);
    return [];
  }
}

// import { LatLngTuple } from "leaflet";
// import { STATE_ABBR } from "@/utils/stateCodeDict";
// // generatingPoints function

// /*def getCities(leftTop,rightBottom,horizontal,vertical):
//     lists = []
//     center = [(leftTop[0] + rightBottom[0]) / 2, (leftTop[1] + rightBottom[1]) / 2]
//     for i in range(horizontal):
//         for j in range(vertical):
//             xCoor = leftTop[0] + (i + 0.5) * (rightBottom[0] - leftTop[0]) / horizontal
//             yCoor = leftTop[1] + (j + 0.5) * (rightBottom[1] - leftTop[1]) / vertical
//             lists.append([xCoor, yCoor, math.dist(center, [xCoor, yCoor])])
//        return (lists.sort(key=lambda x: math.dist(center, x)))
//     */

// const CITIES_TO_FETCH = 5

// function getPoints(bottomLeft: LatLngTuple, topRight: LatLngTuple, horizontal: number, vertical: number): LatLngTuple[] {
//     const lists: LatLngTuple[] = []
//     const center = [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2]
//     for (let i = 0; i < horizontal; i ++){
//         for (let j = 0; j < vertical; j ++){
//             const xCoor = bottomLeft[0] + (i + 0.5) * (topRight[0] - bottomLeft[0]) / horizontal
//             const yCoor = bottomLeft[1] + (j + 0.5) * (topRight[1] - bottomLeft[1]) / vertical
//             lists.push([xCoor, yCoor])
//             // Math.sqrt(Math.pow(center[0] - xCoor, 2) + Math.pow(center[1] - yCoor, 2)

//         }
//     }
//     const d2 = ([x, y]: LatLngTuple) => Math.pow(center[0] - x, 2) + Math.pow(center[1] - y, 2)
//     return lists.sort((a, b) => d2(a) - d2(b))
// }


// export default async function citySearch(
//   bottomLeft: LatLngTuple,
//   topRight: LatLngTuple
// ): Promise<[string, string][]> {
//   const center: LatLngTuple = [
//     (bottomLeft[0] + topRight[0]) / 2,
//     (bottomLeft[1] + topRight[1]) / 2,
//   ];

//   const latSpan = Math.abs(topRight[0] - bottomLeft[0]);
//   const lngSpan = Math.abs(topRight[1] - bottomLeft[1]);
//   const radius = (Math.max(latSpan, lngSpan) * 111) / 2;

//   const url = `https://photon.komoot.io/reverse?lon=${center[1]}&lat=${center[0]}&radius=${radius}&layer=city&limit=${CITIES_TO_FETCH * 3}`;

//   const seenAddresses: [string, string][] = [];

//   try {
//     console.log(url);
//     const response = await fetch(url);
//     const data = await response.json();
//     if (!data.features?.length) return seenAddresses;

//     for (const feature of data.features) {
//       const props = feature.properties;
//       const city = props.name;
//       const state = STATE_ABBR[props.state];
//       if (!seenAddresses.some(([c, s]) => c === city && s === state)) {
//         seenAddresses.push([city, state]);
//       }
//       if (seenAddresses.length >= CITIES_TO_FETCH) break;
//     }
//   } catch (e) {
//     console.error(e);
//   }

//   console.log("seenAddresses: ", seenAddresses);
//   return seenAddresses;
// }



// // export default async function citySearch(bottomLeft: LatLngTuple, topRight: LatLngTuple):Promise<[string, string][]> {
// //     const points = getPoints(bottomLeft, topRight, 3, 3)
// //     //console.log("Center: ", [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2],"Test Points: ", testPoints)
// //     // console.log("Point: ", [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2])
// //     //for (const point of testPoints) {
// //         //console.log("Point: ", [(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2])
// //     //}
// //     let seenAddresses:[string, string][] = [];
   
    
// //     console.log("NOT TESTED")
// //     //const points = [[(bottomLeft[0] + topRight[0]) / 2, (bottomLeft[1] + topRight[1]) / 2]];
// //     const radius = 100
// //     //let addresses:[string, string][] = [];
// //     console.log("Points ," ,points)
// //     for(const latLngs of points){
// //         const url = `https://photon.komoot.io/reverse?lon=${latLngs[1]}&lat=${latLngs[0]}&radius=${radius}&layer=city&limit=1`
        
// //         try {
// //             console.log(url)
// //             const response = await fetch(url)
// //             const data = await response.json()
// //             //console.log(bottomLeft, topRight)
// //             if (!data.features?.length) continue;
// //             console.log('searched with ', latLngs[1], latLngs[0], 'got point at ', data.features[0].geometry.coordinates[0], data.features[0].geometry.coordinates[1])

// //             const focused = data['features']['0']['properties']
            
// //             const city = focused['name']
// //             const state = STATE_ABBR[focused["state"]]
// //             console.log('city: ', city, 'state: ', state)
// //             if (!seenAddresses.some(([c, s]) => c === city && s === state)){
// //                 seenAddresses.push([city, state])
// //             }
// //             //addresses.push([city, state])
// //             if (seenAddresses.length >= CITIES_TO_FETCH){
// //                 break
// //             }
// //         }
// //         catch (e) {
// //             console.error(e)
// //         }
// //     }
// //     console.log("seenAddresses: ", seenAddresses)
// //     return seenAddresses
// // }