
import React from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import useCompassGuide from '@/hooks/useCompassGuide';

interface CompassGuideProps {
  className?: string;
}

const CompassGuide: React.FC<CompassGuideProps> = ({ className }) => {
  const { run, steps, stepIndex, handleJoyrideCallback } = useCompassGuide();

  return (
    <Joyride
      callback={(data: CallBackProps) => handleJoyrideCallback(data)}
      continuous
      hideCloseButton={false}
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      stepIndex={stepIndex}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#9333ea', // Primary color that matches our theme
          textColor: '#333',
        },
        buttonNext: {
          backgroundColor: '#9333ea',
        },
        buttonBack: {
          color: '#9333ea',
        }
      }}
    />
  );
};

export default CompassGuide;
