
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Step } from 'react-joyride';
import { 
  WelcomeStepContent,
  InputStepContent,
  ExamplesStepContent,
  SubmitStepContent,
  TaskListStepContent,
  TaskPriorityStepContent,
  CompleteTaskStepContent
} from '@/components/compass/tour/TourStepContents';

export const useCompassGuide = () => {
  const [tourSteps, setTourSteps] = useState<Step[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasTourBeenShown, setHasTourBeenShown] = useLocalStorage('compassTourShown', false);

  // Function to check if an element exists in the DOM
  const elementExists = useCallback((selector: string): boolean => {
    return document.querySelector(selector) !== null;
  }, []);
  
  // Setup tour steps with improved content and element checks
  useEffect(() => {
    // Define the tour steps with improved content and icons
    const steps: Step[] = [
      {
        target: '.compass-input-container',
        content: <WelcomeStepContent />,
        disableBeacon: true,
        placement: 'center',
        title: 'Welcome to Strategic Planner',
        floaterProps: {
          hideArrow: true,
        },
      },
      {
        target: '.compass-input-textarea',
        content: <InputStepContent />,
        placement: 'bottom',
        title: 'Task Input',
        disableBeacon: true,
      },
      {
        target: '.compass-examples',
        content: <ExamplesStepContent />,
        placement: 'top',
        title: 'Example Tasks',
      },
      {
        target: '.compass-submit-button',
        content: <SubmitStepContent />,
        placement: 'left',
        title: 'Prioritize Tasks',
      },
      {
        target: '.compass-task-list',
        content: <TaskListStepContent />,
        placement: 'top',
        title: 'Task List',
      },
      {
        target: '.compass-task-item',
        content: <TaskPriorityStepContent />,
        placement: 'right',
        title: 'Task Priority',
        isFixed: true,
      },
      {
        target: '.compass-complete-button',
        content: <CompleteTaskStepContent />,
        placement: 'bottom',
        title: 'Complete Tasks',
      }
    ];

    setTourSteps(steps);
  }, []);

  // Start the tour for first-time users with increased delay
  useEffect(() => {
    if (!hasTourBeenShown) {
      // Longer delay to ensure all elements are rendered
      const timer = setTimeout(() => {
        if (elementExists('.compass-input-container')) {
          startTour();
        } else {
          // Try again after another delay if elements aren't ready
          const retryTimer = setTimeout(() => {
            if (elementExists('.compass-input-container')) {
              startTour();
            }
          }, 1000);
          return () => clearTimeout(retryTimer);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hasTourBeenShown, elementExists]);

  const startTour = () => {
    setIsRunning(true);
  };

  const endTour = () => {
    setIsRunning(false);
    setHasTourBeenShown(true);
  };

  const resetTour = () => {
    setHasTourBeenShown(false);
    startTour();
  };

  return {
    tourSteps,
    isRunning,
    startTour,
    endTour,
    resetTour,
    hasTourBeenShown
  };
};
