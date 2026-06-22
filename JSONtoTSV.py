import urllib.request, json
import os
import pandas as pd
import requests
import calendar
from datetime import date
import json


def get_month_data(m, y):
    start_date = date(y, m, 1)
    _, last_day = calendar.monthrange(start_date.year, start_date.month)
    end_of_month_date = date(start_date.year, start_date.month, last_day)
    url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv("CENSUS_API_KEY")}" # api request url here with dates and stuff
    response = requests.get(url)
    return response.json()["features"]


all_entries = []
for month in range(1, 13):
    rows = get_month_data(month, 2026)
    all_entries += rows


def createTSV(labels): # string array of labels
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