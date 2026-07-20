"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getResultFromAddressAutocomplete } from "@/utils/api";
import { GeoData } from "@/utils/types";
import { Popover,PopoverTrigger,PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "./ui/popover";

import { CircleQuestionMark, Search as SearchIcon } from 'lucide-react';
import { useState } from "react";


// also we're going to need to find the most similar counties to the current search and display them in the dropdown which seems really time inefficient 

interface SearchProps {
        handleSubmit: (lat: number, lng: number, bbox:[number, number, number, number], item: string[]) => void;
}



export function Search({handleSubmit}: SearchProps) {
    // useEffect with empty dep to fetch tracts
    // onchange on the input leads to a function to update the top 5 results, which should use a useState
    // on enter or search or whatever, just pick the first one
    // figure out how to change the arrow thingy. id suggest digging around in the combobox file for an icon and just deleting it but if you have another idea thats fine

    const [menu, setMenu] = useState<GeoData[]>([])

    const multiplier = 2;

    async function handleSearchChange(input: String) {
        const results = await getResultFromAddressAutocomplete(input, null)
        console.log(results)
        if (results.features.length > 0) {
            setMenu(results.features.map((feature:any)=>{
                return {
                    name: feature.properties.address_line1,
                    lat: feature.properties.lat,
                    lng: feature.properties.lon,
                    county: feature.properties.county,
                    bbox: feature.bbox
                }
            }
            ))
        }
    }

  return (
    <Combobox items={menu}>
      <Tooltip>
        <TooltipTrigger asChild>
          <ComboboxInput placeholder="Search for a city or county"
          className='absolute top-4 left-6 z-100
          h-11 w-64 px-4
          rounded-full
          border border-white/40
          bg-white/50
          text-sm/4 text-gray-900 placeholder-gray-500
          shadow-xl
          backdrop-blur-2xl backdrop-saturate-150'
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(event)=>{
            console.log('key pressed')
            if (event.key == 'Enter'){
              console.log('enter pressed')
              handleSubmit(menu[0].lat, menu[0].lng, menu[0].bbox, menu[0].name.split(', '))
            }
          }} 
      />
      </TooltipTrigger>
      <TooltipContent side='right' className="bg-white text-gray-800 ml-10">
          <p >Search</p>
          <Popover>
            <PopoverTrigger>
                <CircleQuestionMark scale='0.1'/>
            </PopoverTrigger>
            <PopoverContent side='bottom' className='mt-3'>
                <PopoverHeader>
                    <PopoverTitle>Locate Cities And Counties</PopoverTitle>
                    <PopoverDescription className='text-xs'>
                        Search for cities and counties you are interested in. When searching for cities, listings in the area will be automatically pulled up
                    </PopoverDescription>
                </PopoverHeader>
            </PopoverContent>
          </Popover>
      </TooltipContent>
    </Tooltip>
      <ComboboxContent className='absolute top-3 -left-4 z-100 w-64 rounded-2xl border border-white/40 bg-white/50 text-gray-900 shadow-xl backdrop-blur-2xl backdrop-saturate-150'>
        <ComboboxEmpty className='text-gray-900'>No items found.</ComboboxEmpty>
        <ComboboxList className='text-gray-900'>
          {(item: GeoData) => (
            <ComboboxItem
                key={item.name}
                value={item.name}
                className="relative w-full items-center justify-between rounded-2xl p-4"
                onClick={
                    () => {
                        handleSubmit(item.lat, item.lng, item.bbox, item.name.split(', '))
                    }
                }
            >
              <p className='absolute left-3'>
                {item.name}
              </p>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
