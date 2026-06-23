

import urllib.request, json
import os
# import pandas as pd
import requests
import calendar
from datetime import date
import json
import csv

from dotenv import load_dotenv

load_dotenv()


url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv('CENSUS_API_KEY')}" # api request url here with dates and stuff
response = requests.get(url)

all_entries = []
res = response.json()
for row in res:
    all_entries.append(row[:4])


with open(f"data.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")
    
    writer.writerows(all_entries)
