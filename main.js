const lat = "37.7749";
const lon = "-122.4194";
const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

fetch(url, {
    headers: {
        'User-Agent': 'YourAppName (your-email@example.com)' 
    }
})
.then(response => response.json())
.then(data => {
    console.log("Full Address:", data.display_name);
    console.log("City:", data.address.country);
})
.catch(err => console.error("Error:", err));


// Target radius size for a
const targetRadius = 300;

// Starting Zoom
const startZoom = 15
var currentZoom = startZoom

// Initializing Map
var map = L.map('map').setView([Number(lat), Number(lon)], startZoom);

var marker4 = L.marker([Number(lat), Number(lon)]).addTo(map)

// Converting target meters into pixels
function pixelRadius(meters, map){
    const lat = map.getCenter().lat;
    const metersPerPixel = 40075016.686 * Math.abs(Math.cos((lat * Math.PI) / 180)) / Math.pow(2, map.getZoom() + 8);
    return meters / metersPerPixel;
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var heatData = []

for(let i = 0; i < 15; i++){
    for (let x = 0; x < 400; x++){
        heatData.push([38.9072 + 0.0001*x, -77.0419 + 0.001*i, 10])
    }
}

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


marker = L.marker([44.915910, -66.991201]).addTo(map)

function formGrid(spacing, startingLocation){
    
}

secondPoint = findNextVerticalPoint(1, [44.915910, -66.991201])

console.log(secondPoint)

marker2 = L.marker(secondPoint).addTo(map)

console.log("Distance:", map.distance([44.915910, -66.996201], secondPoint))