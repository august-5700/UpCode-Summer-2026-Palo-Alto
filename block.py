

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
res = response.json()

lim = 60

with open(f"data1.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")

    row = res[1]

    stateFIP, countyFIP = row[5], row[6]
    url = f"https://api.census.gov/data/2024/acs/acs5?get=NAME,B25077_001E,B25064_001E,B25001_001E,B25002_001E,B25002_003E&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
    response = requests.get(url)
    for r in response.json():
        writer.writerow(r)


    for i in range(2, lim):
        print(f"{i}/{lim}", end="\r")
        row in res[i]
        # print(row)
        stateFIP, countyFIP = row[5], row[6]
        url = f"https://api.census.gov/data/2024/acs/acs5?get=NAME,B25077_001E,B25064_001E,B25001_001E,B25002_001E,B25002_003E&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
        response = requests.get(url)

        for r in response.json()[1:lim]:

            writer.writerow(r)
