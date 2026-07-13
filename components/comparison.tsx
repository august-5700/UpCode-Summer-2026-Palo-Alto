import { Card } from "./ui/card";

export default function Comparison() {
    return (
        <Card className="absolute right-4 top-4 bottom-4 z-[1000] flex w-140 flex-col gap-6 rounded-3xl border border-white/40 bg-white/50 p-8 shadow-2xl backdrop-blur-2xl backdrop-saturate-150">
            {/* Header */}
            <h2 className="w-100% text-center font-bold text-2xl">Property Comparison</h2>
            
            <div className="flex w-100% h-60 overflow-x-auto">
                <h1 className="text-lg h-full w-40 bg-gray-100 rounded-xl border-2 shrink-0">Property 1</h1>
                <h1 className="text-lg ml-2 h-full w-40 bg-gray-100 rounded-xl border-2 shrink-0">Property 2</h1>
                <h1 className="text-lg ml-2 h-full w-40 bg-gray-100 rounded-xl border-2 shrink-0">Property 3</h1>
                <h1 className="text-lg ml-2 h-full w-40 bg-gray-100 rounded-xl border-2 shrink-0">Property 4</h1>
                <h1 className="text-lg ml-2 h-full w-40 bg-gray-100 rounded-xl border-2 shrink-0">Property 5</h1>
                
            </div>
        </Card>
    );
    }