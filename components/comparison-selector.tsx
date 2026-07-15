import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ComparisonSelectorProps {
    item: string
}

export default function ComparisonSelector({item}: ComparisonSelectorProps) {
  return (
    <div className="relative flex flex-col items-center justify-center mx-2 border-2 border-blue-500 bg-blue-300/20 border-dashed rounded-lg overflow-hidden h-full">
      <h2 className="text-md font-bold text-center tracking-tight text-gray-900">
        Select another {item} to compare
      </h2>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-2 rounded-full text-gray-400 hover:text-gray-900"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
