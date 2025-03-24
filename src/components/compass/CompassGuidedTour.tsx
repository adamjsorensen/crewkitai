
import React from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useCompassGuide } from '@/hooks/useCompassGuide';

const CompassGuidedTour: React.FC = () => {
  const { tourSteps, isRunning, endTour } = useCompassGuide();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    // End the tour when it's finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
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
      styles={{
        options: {
          primaryColor: 'var(--primary)',
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: 'var(--primary)',
        },
        buttonBack: {
          color: 'var(--primary)',
        },
      }}
      locale={{
        last: 'Finish',
        skip: 'Skip tour',
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default CompassGuidedTour;
