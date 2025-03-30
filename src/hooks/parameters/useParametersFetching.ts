
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PromptParameter, ParameterTweak } from './types';

export function useParametersFetching() {
  const [error, setError] = useState<string | null>(null);

  // Fetch all parameters
  const { data: parameters, isLoading: isLoadingParameters, isError: isErrorParameters } = useQuery({
    queryKey: ['prompt-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_parameters')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching parameters:', error);
        setError(error.message);
        throw new Error(`Failed to fetch parameters: ${error.message}`);
      }
      
      return data as PromptParameter[];
    },
  });

  // Fetch all parameter tweaks
  const { data: tweaks, isLoading: isLoadingTweaks, isError: isErrorTweaks } = useQuery({
    queryKey: ['parameter-tweaks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parameter_tweaks')
        .select('*')
        .order('order', { ascending: true });
      
      if (error) {
        console.error('Error fetching parameter tweaks:', error);
        setError(error.message);
        throw new Error(`Failed to fetch parameter tweaks: ${error.message}`);
      }
      
      return data as ParameterTweak[];
    },
  });

  return {
    parameters: parameters || [],
    tweaks: tweaks || [],
    isLoading: isLoadingParameters || isLoadingTweaks,
    isError: isErrorParameters || isErrorTweaks,
    error
  };
}
