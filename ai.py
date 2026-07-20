from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

print("API key found:", api_key is not None)



client = OpenAI(api_key=api_key)

def summary(pmt,data):
    prompt = f"Prompt: {pmt}Data: {data}"
    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    #return "Temporary"
    
    return response.choices[0].message.content

