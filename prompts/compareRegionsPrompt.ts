export const COMPARE_REGIONS_PROMPT = [
    "You are helping someone choose between these areas for a rental property investment.",
    "Each entry has a name, a 0-10 heat score, and key housing metrics.",
    "Using only the data provided, compare them head to head:",
    "(1) say which area looks stronger for a rental investor and cite the specific numbers that decide it;",
    "(2) name the main tradeoff or risk of choosing it over the other(s).",
    "Never invent figures beyond the data given, and refer to areas by the exact names provided.",
    "Max 3 short sentences, under 60 words. No preamble, no bullet points.",
].join(" ");
