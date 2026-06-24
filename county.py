

import urllib.request, json
import os
import requests
import json
import csv

from dotenv import load_dotenv
load_dotenv()

header = [
    'ID',
    'State FIP',
    'County FIP ',
    'Median Home Value',
    'Median Home Value Margin of Error',
    'Median Gross Rent',
    'Median Gross Rent Margin of Error',
    'Total Housing Units',
    'Total Margin of Error',
    'Total Occupied Housing Units',
    'Occupied Margin of Error (percent)',
    'Total Vacant Housing Units',
    'Vacant Margin of Error (percent)',
    'Latitude',
    'Longitude'
]

cols_to_get = [
    'DP04_0089E',
    'DP04_0089M',
    'DP04_0134E',
    'DP04_0134M',
    'DP04_0001E',
    'DP04_0001M',
    'DP04_0002E',
    'DP04_0002M',
    'DP04_0003E',
    'DP04_0003M'
]

def get_county_level_data(cols_to_get = None):
    if cols_to_get:
        url = f"https://api.census.gov/data/2024/acs/acs5/profile?get={','.join(cols_to_get)}&for=county:*&key={os.getenv("CENSUS_API_KEY")}"
    else:
        url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv("CENSUS_API_KEY")}"
    response = requests.get(url)
    return response.json()

res = get_county_level_data(cols_to_get)

def getCoordsFromTSV(stateFIP, countyFIP):
    with open(f'county_coords.tsv', 'r', newline='', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter='\t')
        for row in reader:
            if row[1] == stateFIP and row[2] == countyFIP:
                return [row[7], row[8]]

with open(f"counties.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")
    writer.writerow(header)
    for r in res[1::]:
        print(r)
        stateFIP, countyFIP = r[10], r[11]
        edited_row = r[-2:]+r[:-2]
        edited_row.append(getCoordsFromTSV(stateFIP, countyFIP)[0])
        edited_row.append(getCoordsFromTSV(stateFIP, countyFIP)[1])
        edited_row.insert(0, res.index(r) - 1)
        writer.writerow(edited_row)
