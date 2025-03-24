
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useNeedsOnboarding = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('onboarding_progress')
          .select('is_completed')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding status:', error);
          setNeedsOnboarding(true); // Assume onboarding needed if there's an error
        } else {
          // If no record or is_completed is false, user needs onboarding
          setNeedsOnboarding(!data || !data.is_completed);
        }
      } catch (err) {
        console.error('Error in onboarding check:', err);
        setNeedsOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading]);

  return { needsOnboarding, isLoading };
};
