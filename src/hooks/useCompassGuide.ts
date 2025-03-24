
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Step } from 'react-joyride';

export const useCompassGuide = () => {
  const [tourSteps, setTourSteps] = useState<Step[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasTourBeenShown, setHasTourBeenShown] = useLocalStorage('compassTourShown', false);
  
  useEffect(() => {
    // Define the tour steps
    const steps: Step[] = [
      {
        target: '.compass-input-container',
        content: 'Welcome to the Strategic Planner! Start by entering your tasks here.',
        disableBeacon: true,
        placement: 'bottom',
        title: 'Enter Tasks',
      },
      {
        target: '.compass-input-textarea',
        content: 'Type in your tasks, ideas, or to-dos. You can enter multiple items at once.',
        placement: 'bottom',
        title: 'Task Input',
      },
      {
        target: '.compass-examples',
        content: 'Need inspiration? Click on these examples to add them to your input.',
        placement: 'top',
        title: 'Example Tasks',
      },
      {
        target: '.compass-submit-button',
        content: 'When you\'re ready, click this button to have AI prioritize your tasks.',
        placement: 'left',
        title: 'Prioritize Tasks',
      },
      {
        target: '.compass-task-list',
        content: 'Your prioritized tasks will appear here, organized by importance.',
        placement: 'top',
        title: 'Task List',
      },
      {
        target: '.compass-task-item',
        content: 'Each task is assigned a priority. High priority tasks are shown first.',
        placement: 'right',
        title: 'Task Priority',
      },
      {
        target: '.compass-complete-button',
        content: 'Mark tasks as complete when you finish them.',
        placement: 'bottom',
        title: 'Complete Tasks',
      }
    ];

    setTourSteps(steps);
  }, []);

  // Start the tour for first-time users
  useEffect(() => {
    if (!hasTourBeenShown) {
      // Delay the tour slightly to ensure all elements are rendered
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasTourBeenShown]);

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
