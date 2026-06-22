import urllib.request, json
import os
import pandas as pd
import requests
import calendar
from datetime import date
import json

col_options = [
    "NAME",
    "DP04_0089E",
    "DP04_0134E",
    "DP04_0001E",
    "DP04_0003PE",
    "state",
    "county"
]

def get_county_level_data(cols_to_get = "", state = '*', county = '*'):
    # verify that all cols passed are valid 
    if cols_to_get:
        for col in cols_to_get:
            if col not in col_options:
                break
    if state: 

        
    url = f"https://api.census.gov/data/2024/acs/acs5/profile?get={cols_to_get}&for=county:{county}&in:{state}&key={os.getenv("CENSUS_API_KEY")}" # api request url here with dates and stuff
    response = requests.get(url)
    return response.json()

def get_block_level_data(state, county, cols_to_get = ""): # enter state and county as fip
    # verify that all cols passed are valid 
    if cols_to_get:
        for col in cols_to_get:
            if col not in col_options:
                break
    if state: 

        
    url = f"https://api.census.gov/data/2024/acs/acs5?get=NAME,B25077_001E,B25064_001E,B25001_001E,B25002_001E,B25002_003E&for=block%20group:*&in=state:{state}%20county:{county}%20tract:*&key={os.getenv('CENSUS_API_KEY')}" # api request url here with dates and stuff
    response = requests.get(url)
    return response.json()


all_entries = []
res = get_data()
for row in res:
    all_entries.append(row[:4])

with open(f)

def createTSV(labels): # string array of labels (county names)
    f = open('tsvfile.tsv','w')

    toWrite = '\t'.join(labels) + '\n'
    f.write(toWrite)

    id = 0
    for entry in all_entries:
        toApp = f"{id}\t"

        for label in labels:
            toApp += f"{entry[label]}\t"

        toApp += '\n'
        
        f.write(toApp)
        id += 1

    f.close()