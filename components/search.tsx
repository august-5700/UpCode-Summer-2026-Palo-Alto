"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { getResultFromAddressAutocomplete } from "@/utils/api";

import { Search as SearchIcon } from 'lucide-react';
import { useState } from "react";


// also we're going to need to find the most similar counties to the current search and display them in the dropdown which seems really time inefficient 

interface SearchProps {
        handleSubmit: (lat: number, lng: number) => void;
}



export function Search({handleSubmit}: SearchProps) {
    // useEffect with empty dep to fetch tracts
    // onchange on the input leads to a function to update the top 5 results, which should use a useState
    // on enter or search or whatever, just pick the first one
    // figure out how to change the arrow thingy. id suggest digging around in the combobox file for an icon and just deleting it but if you have another idea thats fine

    const [menu, setMenu] = useState<GeoData[]>([])

    async function handleSearchChange(input: String) {
        const results = await getResultFromAddressAutocomplete(input, null)
        console.log(results)
        if (results.features.length > 0) {
            setMenu(results.features.map((feature:any)=>{
                return {
                    name: feature.properties.address_line1,
                    lat: feature.properties.lat,
                    lng: feature.properties.lon,
                    county: feature.properties.county
                }
            }
            ))
        }
    }

  return (
    <Combobox items={menu}>
        <ComboboxInput placeholder="Search..."  
        className='absolute top-4 
        left-6 z-1000 
        bg-white/10 
        backdrop-blur-lg 
        text-black 
        placeholder-black
        shadow-md
        rounded-3xl
        h-10'
        onChange={(e) => handleSearchChange(e.target.value)}
    />
    
      <ComboboxContent className='z-100 bg-white/10 backdrop-blur-lg text-black'>
        <ComboboxEmpty className='z-100 bg-white/10 backdrop-blur-lg text-black'>No items found.</ComboboxEmpty>
        <ComboboxList className='z-1000 bg-white/10 backdrop-blur-lg text-black'>
          {(item: GeoData) => (
            <ComboboxItem key={item.name} value={item.name} onClick={()=>handleSubmit(item.lat, item.lng, )}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
