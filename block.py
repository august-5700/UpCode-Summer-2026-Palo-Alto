import urllib.request, json
import os
import requests
import json
import csv
import random
import time

from dotenv import load_dotenv

from urllib.parse import urlencode

load_dotenv()

start_time = time.perf_counter()

# fetch counties
url = f"https://api.census.gov/data/2024/acs/acs5/profile?get=NAME,DP04_0089E,DP04_0134E,DP04_0001E,DP04_0003PE&for=county:*&key={os.getenv('CENSUS_API_KEY')}" # api request url here with dates and stuff
response = requests.get(url)
res = response.json()

upper_lim = int(input('enter upper lim: '))

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
    'Occupied Margin of Error (percent)',
    'Total Vacant Housing Units',
    'Vacant Margin of Error (percent)',
    'Latitude',
    'Longitude'
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

def fixCodes(value, length=None): # Keep sensus fips as str and keep zeros
    value = str(value).strip()
    if length:
        value = value.zfill(length) # fills the remaining zeros back
    return value

def getCoords(stateFIP, countyFIP, tractCode=None,blockGroup=None):
    stateFIP = fixCodes(stateFIP, 2)
    countyFIP = fixCodes(countyFIP, 3)
    #if there is a tract and a block --> get block coords
    if tractCode is not None and blockGroup is not None:
        tractCode = fixCodes(tractCode,6)
        blockGroup = fixCodes(blockGroup)

        layer = 10 # census block groups
        where = (
            f"STATE='{stateFIP}' AND "
            f"COUNTY='{countyFIP}' AND "
            f"TRACT='{tractCode}' AND "
            f"BLKGRP='{blockGroup}'"
        )
    else: # get county coords
        layer = 82
        where = (
            f"STATE='{stateFIP}' AND "
            f"COUNTY='{countyFIP}'"
        )

    
    base_url = (
        f"https://tigerweb.geo.census.gov/arcgis/rest/services/"
        f"TIGERweb/tigerWMS_ACS2024/MapServer/{layer}/query"
    )

    params = {
        "where": where,
        "outFields": "GEOID,NAME,CENTLAT,CENTLON,INTPTLAT,INTPTLON",
        "returnGeometry": "false",
        "f": "json"
    }

    url = base_url + "?" + urlencode(params)

    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    if "features" not in data or len(data["features"]) == 0: # meant to check if there is no features
        return None
    attrs = data["features"][0]["attributes"]

    return {
        "geoid": attrs.get("GEOID"),
        "name": attrs.get("NAME"),
        "lat": float(attrs.get("INTPTLAT")),
        "lng": float(attrs.get("INTPTLON")),
        "url": url
    }


# begin writing in blocks.tsv
with open(f"blocks.tsv", "w", newline="", encoding="utf-8") as file:

    writer = csv.writer(file, delimiter="\t")

    # write out the block groups for the first (couunty, state) pair
    print('Fetched '+str(len(res))+' state county pairs')

    writer.writerow(header)


    # write out the block groups without headers for each other (county, state) pair until the limit
    for i in range(1, upper_lim):
        loop_start_time = time.perf_counter()
        print(f"Fetching block groups from county {i} of {upper_lim}")
        row = res[i]
        stateFIP, countyFIP = row[5], row[6]
        url = f"https://api.census.gov/data/2024/acs/acs5?get={','.join(cols_to_get)}&for=block%20group:*&in=state:{stateFIP}%20county:{countyFIP}%20tract:*&key={os.getenv('CENSUS_API_KEY')}"
        response = requests.get(url)
        for r in response.json()[1:upper_lim]:
            edited_row = r[-4:]+r[:-4]

            coords = getCoords( # SELECT COORDS FOR LATER!!
                edited_row[0], # state FIP
                edited_row[1], # county FIP
                edited_row[2], # tract code
                edited_row[3] # block group
            )
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
                if c >= 4:
                    try:
                        edited_row[c] = int(edited_row[c])
                    except:
                        pass
            
            if coords: # ADD LAT LNG
                edited_row.append(coords["lat"])
                edited_row.append(coords["lng"])
            else: # IF NO COORDS AVAILABLE
                edited_row.append(None)
                edited_row.append(None)

             
            writer.writerow(edited_row)
        loop_end_time = time.perf_counter()
        print(f'Fetched block groups from county {i}. This county took {(loop_end_time - loop_start_time):.6f} seconds to fetch. It has been {(loop_end_time - start_time):.6f} seconds since the program began.')


