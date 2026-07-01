"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

import { Search as SearchIcon } from 'lucide-react';

const menu = [] // need to get counties

// also we're going to need to find the most similar counties to the current search and display them in the dropdown which seems really time inefficient 

export function Search() {
    // useEffect with empty dep to fetch tracts
    // onchange on the input leads to a function to update the top 5 results, which should use a useState
    // on enter or search or whatever, just pick the first one
    // figure out how to change the arrow thingy. id suggest digging around in the combobox file for an icon and just deleting it but if you have another idea thats fine
  return (
    <Combobox items={menu}>
        <ComboboxInput placeholder="Search..."  className='absolute top-4 left-6 z-1000 bg-white/10 backdrop-blur-lg text-black
    placeholder-black'/>
      <ComboboxContent className='z-100 bg-white/10 backdrop-blur-lg text-black'>
        <ComboboxEmpty className='z-100 bg-white/10 backdrop-blur-lg text-black'>No items found.</ComboboxEmpty>
        <ComboboxList className='z-1000 bg-white/10 backdrop-blur-lg text-black'>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
