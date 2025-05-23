
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
      
      // Simple connection test - use a valid query
      try {
        const { data: testData, error: testError } = await supabase
          .from('prompts')
          .select('id')
          .limit(1);
          
        if (testError) {
          console.error("Connection test failed:", testError);
          throw new Error(`Database connection issue: ${testError.message}`);
        }
        
        console.log("Connection test successful, got data:", testData);
      } catch (connectionError: any) {
        console.error("Connection test error:", connectionError);
        throw new Error(`Failed to connect to database: ${connectionError.message}`);
      }
      
      // Proceed with the actual fetch
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
      
      // Simple connection test using a valid query
      try {
        const { data: testData, error: testError } = await supabase
          .from('prompts')
          .select('id')
          .limit(1);
          
        if (testError) {
          console.error("Connection test failed:", testError);
          throw new Error(`Database connection issue: ${testError.message}`);
        }
        
        console.log("Connection test successful, database is accessible");
      } catch (connectionError: any) {
        console.error("Connection test error:", connectionError);
        throw new Error(`Failed to connect to database: ${connectionError.message}`);
      }
      
      // Proceed with the actual fetch - use maybeSingle for better handling of missing records
      const { data, error: fetchError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (fetchError) {
        console.error(`Error fetching prompt with ID ${id}:`, fetchError);
        setError(`Failed to fetch prompt: ${fetchError.message}`);
        throw new Error(`Failed to fetch prompt: ${fetchError.message}`);
      }
      
      if (!data) {
        console.log(`No prompt found with ID ${id}`);
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
