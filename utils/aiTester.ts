import { summary } from "./ai";
export const testAI = async (data?: any, prompt?: any)=>{
    const ourData = data ? data : {
        city: "San Francisco",
        state: "CA",
        market_trends: {
            median_price: 1200000,
            price_change: 5.2,
            inventory: 1500
        }
    };
    const ourPrompt = prompt ? prompt : "Provide a summary of the market trends."
    const res = await summary(ourPrompt, ourData)
    console.log(res);
    return res
}