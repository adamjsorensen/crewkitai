
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type OnboardingStep = {
  id: number;
  step_key: string;
  title: string;
  description: string | null;
  order_index: number;
  is_required: boolean;
};

export type OnboardingProgress = {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: string[];
  is_completed: boolean;
  started_at: string;
  completed_at: string | null;
};

interface OnboardingContextType {
  steps: OnboardingStep[];
  progress: OnboardingProgress | null;
  currentStepKey: string;
  isLoading: boolean;
  isCompleted: boolean;
  completeStep: (stepKey: string) => Promise<void>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (stepKey: string) => void;
  skipOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStepKey, setCurrentStepKey] = useState<string>('welcome');

  // Fetch steps and progress
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchOnboardingData = async () => {
      setIsLoading(true);
      try {
        // Fetch all onboarding steps
        const { data: stepsData, error: stepsError } = await supabase
          .from('onboarding_steps')
          .select('*')
          .order('order_index', { ascending: true });

        if (stepsError) throw stepsError;
        
        // Fetch user's onboarding progress
        const { data: progressData, error: progressError } = await supabase
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (progressError && progressError.code !== 'PGRST116') {
          throw progressError;
        }

        // If no progress record exists yet, create one
        if (!progressData) {
          const { data: newProgress, error: createError } = await supabase
            .from('onboarding_progress')
            .insert({ user_id: user.id })
            .select('*')
            .single();

          if (createError) throw createError;
          
          // Convert the JSONB completed_steps to a string array
          if (newProgress) {
            setProgress({
              ...newProgress,
              completed_steps: Array.isArray(newProgress.completed_steps) 
                ? newProgress.completed_steps 
                : [],
            });
          }
        } else {
          // Convert the JSONB completed_steps to a string array
          setProgress({
            ...progressData,
            completed_steps: Array.isArray(progressData.completed_steps) 
              ? progressData.completed_steps 
              : [],
          });
        }

        if (stepsData && stepsData.length > 0) {
          setSteps(stepsData);
          
          // Set current step based on progress
          if (progressData && progressData.current_step > 0) {
            const currentStep = stepsData.find(step => step.order_index === progressData.current_step);
            if (currentStep) {
              setCurrentStepKey(currentStep.step_key);
            }
          } else {
            // Default to first step
            setCurrentStepKey(stepsData[0].step_key);
          }
        }
      } catch (error) {
        console.error('Error fetching onboarding data:', error);
        toast({
          title: "Error loading onboarding data",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingData();
  }, [user, toast]);

  // Complete a step
  const completeStep = async (stepKey: string) => {
    if (!user || !progress) return;
    
    try {
      const step = steps.find(s => s.step_key === stepKey);
      if (!step) return;
      
      // Update completed steps array
      const completedSteps = [...progress.completed_steps];
      if (!completedSteps.includes(stepKey)) {
        completedSteps.push(stepKey);
      }

      // Determine if this is the last step
      const isLastStep = step.order_index === steps.length;
      
      // Calculate next step index
      const nextStepIndex = isLastStep ? step.order_index : step.order_index + 1;
      
      // Update progress in the database
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          current_step: nextStepIndex,
          completed_steps: completedSteps,
          is_completed: isLastStep,
          completed_at: isLastStep ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id);

      if (error) throw error;
      
      // Update local state
      setProgress(prev => {
        if (!prev) return null;
        return {
          ...prev,
          current_step: nextStepIndex,
          completed_steps: completedSteps,
          is_completed: isLastStep,
          completed_at: isLastStep ? new Date().toISOString() : null,
        };
      });
      
      // If not the last step, move to the next step
      if (!isLastStep) {
        const nextStep = steps.find(s => s.order_index === nextStepIndex);
        if (nextStep) {
          setCurrentStepKey(nextStep.step_key);
        }
      }
      
      toast({
        title: isLastStep ? "Onboarding completed!" : "Step completed!",
        description: isLastStep 
          ? "You're all set up and ready to go." 
          : "Moving to the next step.",
      });
    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error saving progress",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    const currentStep = steps.find(s => s.step_key === currentStepKey);
    if (!currentStep) return;
    
    const nextStepIndex = currentStep.order_index + 1;
    const nextStep = steps.find(s => s.order_index === nextStepIndex);
    
    if (nextStep) {
      setCurrentStepKey(nextStep.step_key);
    }
  };

  const goToPreviousStep = () => {
    const currentStep = steps.find(s => s.step_key === currentStepKey);
    if (!currentStep || currentStep.order_index <= 1) return;
    
    const prevStepIndex = currentStep.order_index - 1;
    const prevStep = steps.find(s => s.order_index === prevStepIndex);
    
    if (prevStep) {
      setCurrentStepKey(prevStep.step_key);
    }
  };

  const goToStep = (stepKey: string) => {
    const stepExists = steps.some(s => s.step_key === stepKey);
    if (stepExists) {
      setCurrentStepKey(stepKey);
    }
  };

  // Skip onboarding function
  const skipOnboarding = async () => {
    if (!user || !progress) return;
    
    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id);

      if (error) throw error;
      
      setProgress(prev => {
        if (!prev) return null;
        return {
          ...prev,
          is_completed: true,
          completed_at: new Date().toISOString()
        };
      });
      
      toast({
        title: "Onboarding skipped",
        description: "You can always come back later.",
      });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: "Error skipping onboarding",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const isCompleted = progress?.is_completed || false;

  return (
    <OnboardingContext.Provider
      value={{
        steps,
        progress,
        currentStepKey,
        isLoading,
        isCompleted,
        completeStep,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        skipOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
