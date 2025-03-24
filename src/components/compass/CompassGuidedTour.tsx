
import React, { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useCompassGuide } from '@/hooks/useCompassGuide';
import { useToast } from '@/hooks/use-toast';

const CompassGuidedTour: React.FC = () => {
  const { tourSteps, isRunning, endTour, hasTourBeenShown } = useCompassGuide();
  const { toast } = useToast();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;
    
    // End the tour when it's finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
      
      // Show toast when tour is completed
      if (status === STATUS.FINISHED) {
        toast({
          title: "Tour completed!",
          description: "You can restart the tour anytime from the help button.",
        });
      }
    }

    // Handle errors
    if (status === STATUS.ERROR) {
      console.error('Joyride error:', data);
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={isRunning}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableOverlayClose={false}
      spotlightClicks
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 10000,
          arrowColor: 'hsl(var(--background))',
          backgroundColor: 'hsl(var(--background))',
          textColor: 'hsl(var(--foreground))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          beaconSize: 36,
        },
        tooltip: {
          borderRadius: 'var(--radius)',
          fontSize: '0.95rem',
          padding: '12px 16px',
          boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1.1rem',
          fontWeight: 600,
          marginBottom: '6px',
        },
        tooltipContent: {
          padding: '8px 0',
          fontSize: '0.95rem',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 'var(--radius)',
          color: 'hsl(var(--primary-foreground))',
          fontSize: '0.9rem',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--primary))',
          fontSize: '0.9rem',
          marginRight: 10,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.9rem',
        },
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip tour',
        next: 'Next',
        back: 'Back',
      }}
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
          },
        },
      }}
    />
  );
};

export default CompassGuidedTour;
