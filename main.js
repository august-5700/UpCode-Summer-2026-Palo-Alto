// Target radius size for a
const targetRadius = 300;

// Starting Zoom
const startZoom = 15
var currentZoom = startZoom

// Initializing Map
var map = L.map('map').setView([38.9072, -77.0419], startZoom);

// Converting target meters into pixels
function pixelRadius(meters, map){
    const lat = map.getCenter().lat;
    const metersPerPixel = 40075016.686 * Math.abs(Math.cos((lat * Math.PI) / 180)) / Math.pow(2, map.getZoom() + 8);
    return meters / metersPerPixel;
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var heatData = [
    [38.9072, -77.0419, 2],
    // [38.9072, -77.0369, 2],
    // [38.9072, -77.0469, 2]
]

var heatLayer = L.heatLayer(heatData, {
    radius: pixelRadius(targetRadius, map),
    // max: 5,
    // gradient:{0.4: 'blue', 0.65: 'lime', 1: 'red', 1.4: 'blue', 1.65: 'lime', 2: 'red', 2.4: 'blue', 2.65: 'lime', 3: 'red', 3.4: 'blue', 3.65: 'lime', 4: 'red', 4.4: 'blue', 4.65: 'lime', 5: 'red'}
}).addTo(map);

map.on('zoomend', function() {
    let multiplier = 1
    if(map.getZoom() < currentZoom){
        multiplier = 2
    }else{
        multiplier = 1/2
    }

    for(let i = 0; i < heatData.length; i++){
        heatData[i][2] = heatData[i][2]*multiplier
        console.log(heatData[i][2])
    }

    heatLayer.setOptions({ radius: pixelRadius(targetRadius, map) })

    heatLayer.redraw()
    currentZoom = map.getZoom()
})