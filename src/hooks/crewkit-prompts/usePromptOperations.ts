
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Prompt } from './types';

export function usePromptOperations() {
  const [error, setError] = useState<string | null>(null);

  /**
   * Get all prompts from the database
   */
  const getAllPrompts = async (): Promise<Prompt[]> => {
    try {
      console.log("Fetching all prompts...");
      const { data, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (fetchError) {
        console.error("Error fetching prompts:", fetchError);
        setError(fetchError.message);
        throw new Error(`Failed to fetch prompts: ${fetchError.message}`);
      }
      
      console.log(`Successfully fetched ${data?.length || 0} prompts`);
      return data || [];
    } catch (err: any) {
      console.error("Error in getAllPrompts:", err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Get a specific prompt by ID
   */
  const getPromptById = async (id: string): Promise<Prompt | null> => {
    try {
      console.log(`Fetching prompt with ID ${id}...`);
      
      // Add connection validation before the actual fetch
      const { data: connectionTest, error: connectionError } = await supabase
        .from('prompts')
        .select('count(*)')
        .limit(1);
        
      if (connectionError) {
        console.error("Connection test failed:", connectionError);
        throw new Error(`Database connection issue: ${connectionError.message}`);
      }
      
      // Proceed with the actual fetch
      const { data, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error(`Error fetching prompt with ID ${id}:`, fetchError);
        const errorDetails = {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        };
        console.error("Error details:", errorDetails);
        
        setError(`Failed to fetch prompt: ${fetchError.message}`);
        throw new Error(`Failed to fetch prompt: ${fetchError.message}`);
      }
      
      if (!data) {
        console.error(`No prompt found with ID ${id}`);
        return null;
      }
      
      console.log(`Successfully fetched prompt: ${data.title}`);
      return data;
    } catch (err: any) {
      console.error(`Error fetching prompt with ID ${id}:`, err);
      setError(err.message);
      throw err;
    }
  };

  return {
    getAllPrompts,
    getPromptById,
    error
  };
}
