
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Step } from 'react-joyride';
import { Info, CheckCircle, ListPlus, ArrowRight, MoveUp, Calendar, CheckCheck } from 'lucide-react';

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
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Info size={18} />
              <span>Welcome to the Strategic Planner!</span>
            </div>
            <p>This tool helps prioritize your tasks so you can focus on what matters most.</p>
          </div>
        ),
        disableBeacon: true,
        placement: 'center',
        title: 'Welcome to Strategic Planner',
        floaterProps: {
          hideArrow: true,
        },
      },
      {
        target: '.compass-input-textarea',
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <ListPlus size={18} />
              <span>Enter Your Tasks</span>
            </div>
            <p>Type in your tasks, ideas, or to-dos. You can enter multiple items at once.</p>
          </div>
        ),
        placement: 'bottom',
        title: 'Task Input',
        disableBeacon: true,
      },
      {
        target: '.compass-examples',
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Info size={18} />
              <span>Example Tasks</span>
            </div>
            <p>Click on these examples to quickly add them to your input.</p>
          </div>
        ),
        placement: 'top',
        title: 'Example Tasks',
      },
      {
        target: '.compass-submit-button',
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <ArrowRight size={18} />
              <span>Prioritize Your Tasks</span>
            </div>
            <p>When you're ready, click this button to have AI analyze and prioritize your tasks.</p>
          </div>
        ),
        placement: 'left',
        title: 'Prioritize Tasks',
      },
      {
        target: '.compass-task-list',
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <MoveUp size={18} />
              <span>Prioritized Task List</span>
            </div>
            <p>Your tasks will appear here, organized by priority level - focus on high priority items first.</p>
          </div>
        ),
        placement: 'top',
        title: 'Task List',
      },
      {
        target: '.compass-task-item',
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle size={18} />
              <span>Task Priority</span>
            </div>
            <p>Each task is assigned a priority level - High, Medium, or Low. High priority tasks need your attention first.</p>
          </div>
        ),
        placement: 'right',
        title: 'Task Priority',
        isFixed: true,
      },
      {
        target: '.compass-complete-button',
        content: (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <CheckCheck size={18} />
              <span>Complete Tasks</span>
            </div>
            <p>Click here to mark a task as complete when you've finished it.</p>
          </div>
        ),
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
