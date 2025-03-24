
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useCompassGuide } from '@/hooks/useCompassGuide';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const RestartTourButton: React.FC = () => {
  const { resetTour } = useCompassGuide();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetTour}
            className="flex items-center gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Tour Guide</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Restart the guided tour</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RestartTourButton;
