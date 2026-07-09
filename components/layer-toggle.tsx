import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Flame, Grid3X3, Map } from "lucide-react"

interface LayersToggleProps {
  value: string
  onValueChange: (value: string) => void
}

export function LayersToggle({value, onValueChange}: LayersToggleProps) {
  return (

    <RadioGroup defaultValue={value} onValueChange={onValueChange} className="w-fit absolute bottom-4 left-6 z-1000
        rounded-full
        border border-white/40
        bg-white/50 backdrop-blur-2xl backdrop-saturate-150
        shadow-xl
        space-y-3
        p-1
        "
    >
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
            <TooltipContent side='right' className='z-1000'>
                <p>Heat Map</p>
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
            <TooltipContent side='right' className='z-1000'>
                <p>Choropleth Map</p>
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
            <TooltipContent side='right' className='z-1000'>
                <p>Default Map</p>
            </TooltipContent>
        </Tooltip>
    </RadioGroup>
  )
}

