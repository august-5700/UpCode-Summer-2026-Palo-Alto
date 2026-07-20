import { summary } from "./ai";

const ourData = {
    city: "San Francisco",
    state: "CA",
    market_trends: {
        median_price: 1200000,
        price_change: 5.2,
        inventory: 1500
    }
};

console.log(await summary("Provide a summary of the market trends.", ourData));