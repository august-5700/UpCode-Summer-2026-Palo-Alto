

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

def get_county_level_data(cols_to_get = None):
    url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv("CENSUS_API_KEY")}"
    response = requests.get(url)
    return response.json()

all_entries = []
res = get_county_level_data()
for row in res:
    all_entries.append(row[:4])


with open(f"data1.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")
    
    writer.writerows(all_entries)
