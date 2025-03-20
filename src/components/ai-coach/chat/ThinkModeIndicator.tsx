
import React from 'react';
import { Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ThinkModeIndicatorProps {
  isActive: boolean;
}

const ThinkModeIndicator: React.FC<ThinkModeIndicatorProps> = ({ isActive }) => {
  if (!isActive) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="absolute -top-3 right-4 bg-primary/10 border-primary/20 text-primary px-2 py-0.5 text-xs flex items-center gap-1"
          >
            <Brain className="h-3 w-3" />
            Think Mode Active
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" align="end" className="max-w-72">
          <p className="text-xs">Think Mode uses a faster, more concise AI model for quicker responses with less detail. Good for brainstorming or quick questions.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThinkModeIndicator;
