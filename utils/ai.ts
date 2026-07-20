import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

console.log("API key found:", apiKey !== undefined);

const client = new OpenAI({
    apiKey: apiKey,
});

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