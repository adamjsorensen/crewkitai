
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ParameterWithTweaks } from './types';

export function useParameterRulesFetching() {
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches parameters with their associated tweaks and rules for a specific prompt
   */
  const getParametersForPrompt = async (promptId: string): Promise<ParameterWithTweaks[]> => {
    try {
      console.log(`Fetching parameter rules for prompt: ${promptId}`);
      
      // First check if the prompt exists
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('id, title')
        .eq('id', promptId)
        .single();
      
      if (promptError) {
        console.error('Error verifying prompt exists:', promptError);
        throw new Error(`Failed to verify prompt exists: ${promptError.message}`);
      }
      
      if (!promptData) {
        console.error(`No prompt found with ID ${promptId}`);
        throw new Error('Prompt not found');
      }
      
      console.log(`Verified prompt exists: ${promptData.title}`);
      
      // Get all parameter rules for this prompt
      const { data: rules, error: rulesError } = await supabase
        .from('prompt_parameter_rules')
        .select('*')
        .eq('prompt_id', promptId)
        .eq('is_active', true)
        .order('order', { ascending: true });
      
      if (rulesError) {
        console.error('Error fetching parameter rules:', rulesError);
        setError(rulesError.message);
        throw new Error(`Failed to fetch parameter rules: ${rulesError.message}`);
      }
      
      if (!rules || rules.length === 0) {
        console.log(`No parameter rules found for prompt ${promptId}`);
        return [];
      }
      
      console.log(`Found ${rules.length} parameter rules for prompt ${promptId}`);
      
      // Get the parameter IDs from rules
      const parameterIds = rules.map(rule => rule.parameter_id);
      
      // Get the parameters
      const { data: parameters, error: parametersError } = await supabase
        .from('prompt_parameters')
        .select('*')
        .in('id', parameterIds)
        .eq('active', true);
      
      if (parametersError) {
        console.error('Error fetching parameters:', parametersError);
        setError(parametersError.message);
        throw new Error(`Failed to fetch parameters: ${parametersError.message}`);
      }
      
      if (!parameters || parameters.length === 0) {
        console.log(`No active parameters found for prompt ${promptId}`);
        return [];
      }
      
      console.log(`Found ${parameters.length} parameters for prompt ${promptId}`);
      
      // Get the tweaks for these parameters
      const { data: tweaks, error: tweaksError } = await supabase
        .from('parameter_tweaks')
        .select('*')
        .in('parameter_id', parameterIds)
        .eq('active', true)
        .order('order', { ascending: true });
      
      if (tweaksError) {
        console.error('Error fetching parameter tweaks:', tweaksError);
        setError(tweaksError.message);
        throw new Error(`Failed to fetch parameter tweaks: ${tweaksError.message}`);
      }
      
      console.log(`Found ${tweaks?.length || 0} tweaks for parameters`);
      
      // Combine parameters with their tweaks and rules
      const parametersWithTweaks = parameters.map(parameter => {
        const parameterTweaks = tweaks ? tweaks.filter(tweak => tweak.parameter_id === parameter.id) : [];
        const rule = rules.find(rule => rule.parameter_id === parameter.id);
        
        return {
          ...parameter,
          tweaks: parameterTweaks,
          rule: rule
        };
      });
      
      // Sort by the order in rules
      parametersWithTweaks.sort((a, b) => {
        const aRule = rules.find(rule => rule.parameter_id === a.id);
        const bRule = rules.find(rule => rule.parameter_id === b.id);
        
        return (aRule?.order || 0) - (bRule?.order || 0);
      });
      
      console.log('Returning parameters with tweaks:', parametersWithTweaks);
      
      return parametersWithTweaks;
    } catch (error: any) {
      console.error('Error in getParametersForPrompt:', error);
      if (!error.message.includes('Failed to fetch')) {
        // Only throw if it's not already a formatted error
        throw new Error(`Error loading parameters: ${error.message}`);
      }
      throw error;
    }
  };

  return {
    getParametersForPrompt,
    error
  };
}
