

import urllib.request, json
import os
import requests
import json
import csv

from dotenv import load_dotenv
load_dotenv()

header = [
    'ID',
    'NAME',
    'STATE_FIP',
    'COUNTY_FIP',
    'MEDIAN_HOME_VALUE',
    'MEDIAN_HOME_VALUE_MARGIN_OF_ERROR',
    'MEDIAN_GROSS_RENT',
    'MEDIAN_GROSS_RENT_MARGIN_OF_ERROR',
    'TOTAL_HOUSING_UNITS',
    'TOTAL_MARGIN_OF_ERROR',
    'TOTAL_OCCUPIED_HOUSING_UNITS',
    'OCCUPIED_MARGIN_OF_ERROR_PERCENT',
    'TOTAL_VACANT_HOUSING_UNITS',
    'VACANT_MARGIN_OF_ERROR_PERCENT',
    'LATITUDE',
    'LONGITUDE'
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
    'DP04_0003M',
]

def get_county_level_data(cols_to_get = None):
    if cols_to_get:
        url = f"https://api.census.gov/data/2024/acs/acs5/profile?get={','.join(cols_to_get)}&for=county:*&key={os.getenv("CENSUS_API_KEY")}"
    else:
        url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv("CENSUS_API_KEY")}"
    response = requests.get(url)
    return response.json()

res = get_county_level_data(cols_to_get)

def getCoordsFromTSV(stateFIP, countyFIP): # also gets county name
    with open(f'county_coords.tsv', 'r', newline='', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter='\t')
        for row in reader:
            if row[1] == stateFIP and row[2] == countyFIP:
                return [row[7], row[8], row[3]]

with open(f"counties.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")
    writer.writerow(header)
    for r in res[1::]:
        print(r)
        stateFIP, countyFIP = r[10], r[11]
        edited_row = r[-3:]+r[:-3]
        edited_row.append(getCoordsFromTSV(stateFIP, countyFIP)[0])
        edited_row.append(getCoordsFromTSV(stateFIP, countyFIP)[1])
        edited_row.insert(0, res.index(r) - 1)
        edited_row.insert(1, getCoordsFromTSV(stateFIP, countyFIP)[2])
        writer.writerow(edited_row)
