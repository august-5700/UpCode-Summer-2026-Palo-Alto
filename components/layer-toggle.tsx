import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CircleQuestionMark, Flame, Grid3X3, Map, XOctagon } from "lucide-react"

interface LayersToggleProps {
  value: string
  onValueChange: (value: string) => void
}

export function LayersToggle({value, onValueChange}: LayersToggleProps) {
  return (

    <RadioGroup value={value} onValueChange={onValueChange} className="w-fit absolute bottom-4 left-6 z-100
        rounded-full
        border border-white/40
        bg-white/50 backdrop-blur-2xl backdrop-saturate-150
        shadow-xl
        space-y-3
        p-1.5
        "
    >
        <Tooltip>
            <TooltipTrigger asChild>
                <RadioGroupItem
                    value="none"
                    id="r3"
                    className="
                        size-6
                        border-0
                        bg-black/10
                        transition-colors
                        aria-checked:bg-white
                    "
                >
                    <XOctagon className="size-4" />
                </RadioGroupItem>
            </TooltipTrigger>
            <TooltipContent side='right' className='z-100 bg-white text-gray-800'>
                <p>No Overlay</p>
            </TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                <RadioGroupItem
                    value="heatmap"
                    id="r1"
                    className="
                        size-6
                        border-0
                        bg-black/10
                        transition-colors
                        aria-checked:bg-white
                    "
                >
                    <Flame className="size-4" />
                </RadioGroupItem>
            </TooltipTrigger>
            <TooltipContent side='right' className='z-100 bg-white text-black'>
                <p>Heatmap Overlay</p>
                <Popover>
                    <PopoverTrigger>
                        <CircleQuestionMark scale='0.1'/>
                    </PopoverTrigger> 
                    <PopoverContent align="start" side='top' className="mb-2 w-40 px-4 py-3">
                        <PopoverHeader>
                            <PopoverTitle>Shows localized intensity</PopoverTitle>
                            <PopoverDescription className='text-xs'>
                                Nearby data points are blended together to reveal hotspots and smooth trends, making it easier to identify areas with higher or lower values.  
                            </PopoverDescription>
                        </PopoverHeader>
                    </PopoverContent>
                </Popover>
            </TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                <RadioGroupItem
                    value="choropleth"
                    id="r2"
                    className="
                        size-6
                        border-0
                        bg-black/10
                        transition-colors
                        aria-checked:bg-white
                    "
                >
                    <Grid3X3 className="size-4" />
                </RadioGroupItem>
            </TooltipTrigger>
            <TooltipContent side='right' className='z-100 bg-white text-gray-800'>
                <p>Choropleth Overlay</p>
                <Popover>
                    <PopoverTrigger>
                        <CircleQuestionMark scale='0.1'/>
                    </PopoverTrigger> 
                    <PopoverContent align="start" side='top' className="mb-2 w-40 px-4 py-3">
                        <PopoverHeader>
                            <PopoverTitle>Shows regional averages</PopoverTitle>
                            <PopoverDescription className='text-xs'>
                                Each county is colored based on its overall data value, making it easy to compare larger geographic areas at a glance.
                            </PopoverDescription>
                        </PopoverHeader>
                    </PopoverContent>
                </Popover>
            </TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                <RadioGroupItem
                    value="default"
                    id="r3"
                    className="
                        size-6
                        border-0
                        bg-black/10
                        transition-colors
                        aria-checked:bg-white
                    "
                >
                    <Map className="size-4" />
                </RadioGroupItem>
            </TooltipTrigger>
            <TooltipContent side='right' className='z-100 bg-white text-gray-800'>
                <p>Default Overlay</p>
                <Popover>
                    <PopoverTrigger>
                        <CircleQuestionMark scale='0.1'/>
                    </PopoverTrigger> 
                    <PopoverContent align="start" side='top' className="mb-2 w-40 px-4 py-3">
                        <PopoverHeader>
                            <PopoverTitle>Switches overlay based on zoom</PopoverTitle>
                            <PopoverDescription className='text-xs'>
                                Displays the choropleth map when zoomed out for a broad overview, then transitions to the heatmap when zoomed in for more detailed local patterns.                            </PopoverDescription>
                        </PopoverHeader>
                    </PopoverContent>
                </Popover>
            </TooltipContent>
        </Tooltip>

    </RadioGroup>
  )
}




import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export function PopoverBasic() {
  return (
    <>
      <Popover>
        <PopoverTrigger>
            <Button variant="outline" className="w-fit">Open Popover</Button>
        </PopoverTrigger> 
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Dimensions</PopoverTitle>
            <PopoverDescription>
              Set the dimensions for the layer.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </>
  )
}
