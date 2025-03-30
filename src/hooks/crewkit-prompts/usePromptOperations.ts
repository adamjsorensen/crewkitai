
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt } from './types';

export function usePromptOperations() {
  const [error, setError] = useState<string | null>(null);

  // Get all prompts in a flat list
  const getAllPrompts = async () => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_category', false)
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error fetching all prompts:', error);
      setError(error.message);
      throw new Error(`Failed to fetch all prompts: ${error.message}`);
    }
    
    return data as Prompt[];
  };

  // Get prompt by ID
  const getPromptById = async (id: string) => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching prompt with ID ${id}:`, error);
      setError(error.message);
      throw new Error(`Failed to fetch prompt: ${error.message}`);
    }
    
    return data as Prompt;
  };

  return {
    error,
    getAllPrompts,
    getPromptById
  };
}
