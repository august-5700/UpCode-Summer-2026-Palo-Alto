

import urllib.request, json
import os
import requests
import json
import csv

from dotenv import load_dotenv

load_dotenv()

# fetch counties
url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv('CENSUS_API_KEY')}" # api request url here with dates and stuff
response = requests.get(url)
res = response.json()

lim = 60

header = [
    'NAME',
    'Median Home Value',
'Median Gross Rent',
'Total Housing Units',
'Total Occupied Housing Units',
'Total Vacant Housing Units',
'State FIP',
'County FIP ',
'Tract Code',
'Block Group'
]



with open(f"blocks.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")


    # write out the block groups for the first couunty, state pair
    row = res[1]
    stateFIP, countyFIP = row[5], row[6]
    url = f"https://api.census.gov/data/2024/acs/acs5?get=NAME,B25077_001E,B25064_001E,B25001_001E,B25002_001E,B25002_003E&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
    response = requests.get(url)
    for r in response.json():
        if r[0] == 'NAME':
            writer.writerow(header)
        else:
            writer.writerow(r)

    # write out the block groups without headers for each other county, state pair
    for i in range(2, lim):
        print(f"{i}/{lim}")
        row = res[i]
        stateFIP, countyFIP = row[5], row[6]
        url = f"https://api.census.gov/data/2024/acs/acs5?get=NAME,B25077_001E,B25064_001E,B25001_001E,B25002_001E,B25002_003E&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
        response = requests.get(url)
        for r in response.json()[1:lim]:
            writer.writerow(r)
