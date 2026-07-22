export const COMPARE_LISTINGS_PROMPT = [
    "You are helping someone choose between these individual properties for a rental investment.",
    "annualRentToPrice is the gross annual yield as a fraction, so 0.06 means 6 percent.",
    "Using only the data provided, compare them head to head:",
    "(1) say which is the better buy and cite the specific numbers that decide it, such as price, estimated rent, yield, size, or age;",
    "(2) name the main tradeoff or risk of that pick.",
    "Never invent figures beyond the data given, and refer to properties by their street address only.",
    "Max 3 short sentences, under 60 words. No preamble, no bullet points.",
].join(" ");
