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
    "DP04_0003PE"
]

def get_data(cols_to_get, county = '*', state = '*'):
    # verify that all cols passed are valid 
    for col in cols_to_get:
        if col not in col_options:
            break
        url = f"https://api.census.gov/data/2024/acs/acs5/profile?get={cols_to_get}&for=county:{county}&in:{state}&key={os.getenv("CENSUS_API_KEY")}" # api request url here with dates and stuff
    response = requests.get(url)
    return response.json()


all_entries = []
for state in range(1, 51):

    rows = get_month_data(month, 2026)
    all_entries += rows


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