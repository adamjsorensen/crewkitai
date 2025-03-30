
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Prompt } from './types';

export function usePromptsFetching(parentId: string | null = null) {
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['prompts', parentId],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching prompts:', error);
        setError(error.message);
        throw new Error(`Failed to fetch prompts: ${error.message}`);
      }
      
      return data as Prompt[];
    },
  });

  return {
    prompts: data || [],
    isLoading,
    isError,
    error
  };
}
