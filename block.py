

import urllib.request, json
import os
import requests
import json
import csv
import random

from dotenv import load_dotenv

load_dotenv()

# fetch counties
url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv('CENSUS_API_KEY')}" # api request url here with dates and stuff
response = requests.get(url)
res = response.json()

lim = 10

header = [
    'State FIP',
    'County FIP ',
    'Tract Code',
    'Block Group',
    'Median Home Value',
    'Median Home Value Margin of Error',
    'Median Gross Rent',
    'Median Gross Rent Margin of Error',
    'Total Housing Units',
    'Total Margin of Error',
    'Total Occupied Housing Units',
    'Occupied Margin of Error (percent)'
    'Total Vacant Housing Units',
    'Vacant Margin of Error (percent)'
]

cols_to_get = [
    'B25077_001E',
    'B25077_001M',
    'B25064_001E',
    'B25064_001M',
    'B25002_001E',
    'B25002_001M',
    'B25002_002E',
    'B25002_002M',
    'B25002_003E',
    'B25002_003M'
]

# for c in cols_to_get:
#     header[cols_to_get.index(c)] +=  ' - ' + c


# begin writing in blocks.tsv
with open(f"blocks.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")

    # write out the block groups for the first (couunty, state) pair
    row = res[1]
    stateFIP, countyFIP = row[5], row[6]
    url = f"https://api.census.gov/data/2024/acs/acs5?get={','.join(cols_to_get)}&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
    response = requests.get(url)
    print('Fetched '+str(len(res))+' state county pairs')

    writer.writerow(header)


    for r in response.json():
        # edit the current row to display cols in the desired order
        edited_row = r[-4:]+r[:-4]
        # check for numerical jam values and replace with appropriate error messages
        for c in range(len(edited_row)):
            match edited_row[c]:
                case '-666666666':
                    edited_row[c] = None #SMALL SAMPLE SIZE
                case '-888888888':
                    edited_row[c] = None #NA
                case '-999999999':
                    edited_row[c] = None #NA FOR REGION
                case '-222222222':
                    edited_row[c] = None #MOE SMALL SAMPLE SIZE
                case '-333333333':
                    edited_row[c] = None #MEDIAN IN LOWER/UPPER INTERVAL
                case '-555555555':
                    edited_row[c] = 0                    
            try:
                edited_row[c] = int(edited_row[c])
            except:
                ValueError
        if edited_row[0] != 'state':
            writer.writerow(edited_row)


    # write out the block groups without headers for each other (county, state) pair until the limit
    for i in range(2, lim):
        print(f"Fetching block groups from county {i} of {lim}")
        row = res[i]
        stateFIP, countyFIP = row[5], row[6]
        url = f"https://api.census.gov/data/2024/acs/acs5?get={','.join(cols_to_get)}&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
        response = requests.get(url)
        for r in response.json()[1:lim]:
            edited_row = r[-4:]+r[:-4]
            for c in range(len(edited_row)):
                match edited_row[c]:
                    case '-666666666':
                        edited_row[c] = None #SMALL SAMPLE SIZE
                    case '-888888888':
                        edited_row[c] = None #NA
                    case '-999999999':
                        edited_row[c] = None #NA FOR REGION
                    case '-222222222':
                        edited_row[c] = None #MOE SMALL SAMPLE SIZE
                    case '-333333333':
                        edited_row[c] = None #MEDIAN IN LOWER/UPPER INTERVAL
                    case '-555555555':
                        edited_row[c] = 0
                try:
                    edited_row[c] = int(edited_row[c])
                except:
                    ValueError
            writer.writerow(edited_row)
