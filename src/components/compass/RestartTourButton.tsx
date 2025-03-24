
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useCompassGuide } from '@/hooks/useCompassGuide';

const RestartTourButton: React.FC = () => {
  const { resetTour } = useCompassGuide();

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={resetTour}
      className="flex items-center gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      <span>Tour Guide</span>
    </Button>
  );
};

export default RestartTourButton;
