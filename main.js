// Target radius size for a
const targetRadius = 300;

// Starting Zoom
const startZoom = 13

// Initializing Map
var map = L.map('map').setView([38.9072, -77.0369], startZoom);

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
    [38.9072, -77.1369, 30],
    [38.9072, -77.0419, 50]
]

var heatLayer = L.heatLayer(heatData, {
    radius: pixelRadius(targetRadius, map),
}).addTo(map);

map.on('zoomend', function() {
    heatLayer.setOptions({ radius: pixelRadius(targetRadius, map) })
    for(let i = 0; i < heatData.length; i++){
        heatData[i][2] = heatData[i][2]/Math.pow(2, map.getZoom() - startZoom)
        console.log(heatData[i][2])
    }
    heatLayer.redraw()
})