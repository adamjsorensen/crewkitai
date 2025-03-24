
import { useState, useEffect } from 'react';
import { Step } from 'react-joyride';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

export const useCompassGuide = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { toast: uiToast } = useToast();

  // Check if the user has already seen the guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('compass_guide_seen');
    if (!hasSeenGuide && window.location.pathname.includes('/dashboard/compass')) {
      setTimeout(() => {
        setRun(true);
        toast("Welcome to Strategic Planner!", {
          description: "Let's take a quick tour to help you get started.",
          duration: 5000,
        });
      }, 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.compass-input-card',
      content: 'Start by entering your tasks here. List everything you need to get done.',
      disableBeacon: true,
      placement: 'bottom',
      title: 'Enter Your Tasks',
    },
    {
      target: '.compass-input-form',
      content: 'Type one or more tasks that you need to complete. Try to be specific!',
      placement: 'top',
      title: 'Add Task Details',
    },
    {
      target: '.compass-submit-button',
      content: 'Click this button to have AI prioritize your tasks based on importance and urgency.',
      placement: 'left',
      title: 'Prioritize Tasks',
    },
    {
      target: '.task-list-container',
      content: 'Your prioritized tasks will appear here, organized by importance.',
      placement: 'top',
      title: 'Review Your Tasks',
    },
    {
      target: '.task-action-complete',
      content: 'Click here to mark a task as complete once you've finished it.',
      placement: 'left',
      title: 'Complete Tasks',
    },
    {
      target: '.task-view-switcher',
      content: 'Switch between different views of your tasks - List, Kanban, or Calendar.',
      placement: 'bottom', 
      title: 'Change View',
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { action, index, status, type } = data;

    if ((['close', 'skip'].includes(action) || status === 'finished') && type === 'tour:end') {
      // Mark the guide as seen when the user completes or skips it
      localStorage.setItem('compass_guide_seen', 'true');
      setRun(false);
    } else if (type === 'step:after') {
      // Update step index
      setStepIndex(index + 1);
    }
  };

  const startGuide = () => {
    setStepIndex(0);
    setRun(true);
  };

  return {
    run,
    steps,
    stepIndex,
    handleJoyrideCallback,
    startGuide
  };
};

export default useCompassGuide;
