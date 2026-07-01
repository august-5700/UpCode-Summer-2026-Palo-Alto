"use client"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const tracts = [
  "Next.js",
  "SvelteKit",
  "Nuxt.js",
  "Remix",
  "Astro"
]

export function Search() {
    // useEffect with empty dep to fetch tracts
    // onchange on the input leads to a function to update the top 5 results, which should use a useState
    // on enter or search or whatever, just pick the first one
    // figure out how to change the arrow thingy. id suggest digging around in the combobox file for an icon and just deleting it but if you have another idea thats fine
  return (
    <Combobox items={tracts}>
      <ComboboxInput placeholder="Search..."  className='absolute top-4 left-6 z-1000 bg-white'/>
      <ComboboxContent className='z-100 bg-white'>
        <ComboboxEmpty className='z-100 bg-white'>No items found.</ComboboxEmpty>
        <ComboboxList className='z-1000 bg-white'>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
