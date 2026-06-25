const nominatim = require('nominatim-client');

const client = nominatim.createClient({
    useragent: "Rent to price comparison",
});

const query = {
    lat: "37.7749",
    lon: "-122.4194"
};

client.reverse(query)
    .then((result) => {
        if (result) {
            console.log("Full Address:", result.display_name);
            
            console.log("Address Details:", result.address);
        } else {
            console.log("No address found for these coordinates.");
        }
    })
    .catch((err) => {
        console.error("Error running reverse geocode:", err);
    });
