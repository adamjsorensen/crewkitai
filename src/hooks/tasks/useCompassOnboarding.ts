
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCompassOnboarding = () => {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setHasOnboarded(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('compass_user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding status:', error);
          toast({
            title: "Error",
            description: "Failed to check your profile status.",
            variant: "destructive",
          });
          return;
        }

        // If we got data back, the user has completed onboarding
        setHasOnboarded(!!data);
      } catch (err) {
        console.error('Error in onboarding check:', err);
      }
    };

    checkOnboardingStatus();
  }, [user, toast]);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setHasOnboarded(true);
  };

  return {
    hasOnboarded,
    handleOnboardingComplete,
  };
};
