"use server"
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY!
console.log('apikey: ', apiKey)

const client = new OpenAI({
    apiKey: apiKey,
});

const stripCitations = (s: string) =>
    s
        .replace(/\(\s*\[[^\]]*\]\([^)]*\)\s*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\(\s*\)/g, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+([.,;:])/g, "$1")
        .trim();

export async function webSearchSummary(
    pmt: string,
    data: object
): Promise<string> {
    const response = await client.responses.create({
        model: "gpt-4.1",
        tools: [{ type: "web_search" }],
        input: `Prompt: ${pmt}\nData: ${JSON.stringify(data, null, 2)}`,
    });

    return stripCitations(response.output_text ?? "");
}

export async function summary(
    pmt: string,
    data: object
): Promise<string> {
    const prompt = `Prompt: ${pmt}\nData: ${JSON.stringify(data, null, 2)}`;

    const response = await client.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    return response.choices[0].message.content ?? "";
}