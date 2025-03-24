
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOnboardingSteps = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeOnboardingSteps = async () => {
      setIsLoading(true);
      
      try {
        // Check if we already have onboarding steps
        const { data: existingSteps, error: checkError } = await supabase
          .from('onboarding_steps')
          .select('*');
          
        if (checkError) throw checkError;
        
        // If no steps exist yet, initialize them
        if (!existingSteps || existingSteps.length === 0) {
          setIsInitializing(true);
          
          // Define the default steps
          const defaultSteps = [
            {
              step_key: 'welcome',
              title: 'Welcome',
              description: 'Welcome to CrewkitAI',
              order_index: 1,
              is_required: true
            },
            {
              step_key: 'business_profile',
              title: 'Business Profile',
              description: 'Tell us about your painting business',
              order_index: 2,
              is_required: true
            },
            {
              step_key: 'feature_tour',
              title: 'Feature Tour',
              description: 'Discover the key features',
              order_index: 3,
              is_required: true
            },
            {
              step_key: 'compass_intro',
              title: 'Strategic Compass',
              description: 'Learn about task management',
              order_index: 4,
              is_required: true
            },
            {
              step_key: 'ai_coach_intro',
              title: 'AI Coach',
              description: 'Meet your AI business advisor',
              order_index: 5,
              is_required: true
            },
            {
              step_key: 'completion',
              title: 'Completion',
              description: 'Complete the onboarding process',
              order_index: 6,
              is_required: true
            }
          ];
          
          // Insert the default steps
          const { error: insertError } = await supabase
            .from('onboarding_steps')
            .insert(defaultSteps);
            
          if (insertError) throw insertError;
          
          toast({
            title: "Onboarding steps initialized",
            description: "Default onboarding steps have been created.",
          });
          
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('Error initializing onboarding steps:', error);
        toast({
          title: "Error initializing onboarding steps",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeOnboardingSteps();
  }, [toast]);
  
  return { isLoading, isInitializing };
};
