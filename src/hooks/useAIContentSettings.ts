
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the types of AI content settings
export type AIContentSettings = {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
  contentModifierTemperature: number;
};

// Default settings to use if none are found in the database
const defaultSettings: AIContentSettings = {
  systemPrompt: 'You are an expert content writer for painting professionals. Create high-quality, professional content based on the provided prompt and specifications.',
  temperature: 0.7,
  maxTokens: 2000,
  model: 'gpt-4o-mini',
  contentModifierTemperature: 0.7
};

export function useAIContentSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-content-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('name, value')
        .in('name', [
          'content_generator_system_prompt',
          'content_generator_temperature',
          'content_generator_max_tokens',
          'content_generator_model',
          'content_modifier_temperature'
        ]);
      
      if (error) {
        console.error('Error fetching AI content settings:', error);
        setError(error.message);
        throw new Error(`Failed to fetch AI content settings: ${error.message}`);
      }
      
      // Map DB results to settings object
      const settings: AIContentSettings = { ...defaultSettings };
      
      if (data) {
        data.forEach(setting => {
          try {
            const value = JSON.parse(setting.value);
            
            switch (setting.name) {
              case 'content_generator_system_prompt':
                settings.systemPrompt = value;
                break;
              case 'content_generator_temperature':
                settings.temperature = parseFloat(value);
                break;
              case 'content_generator_max_tokens':
                settings.maxTokens = parseInt(value);
                break;
              case 'content_generator_model':
                settings.model = value;
                break;
              case 'content_modifier_temperature':
                settings.contentModifierTemperature = parseFloat(value);
                break;
            }
          } catch (e) {
            console.error(`Error parsing setting ${setting.name}:`, e);
          }
        });
      }
      
      return settings;
    },
  });

  // Update a setting
  const updateSetting = useMutation({
    mutationFn: async ({ name, value }: { name: string; value: any }) => {
      // Check if setting already exists
      const { data: existingData, error: existingError } = await supabase
        .from('ai_settings')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      
      if (existingError) {
        console.error(`Error checking if setting ${name} exists:`, existingError);
        throw new Error(`Failed to check if setting exists: ${existingError.message}`);
      }
      
      let result;
      
      if (existingData) {
        // Update existing setting
        result = await supabase
          .from('ai_settings')
          .update({ value: JSON.stringify(value) })
          .eq('name', name)
          .select()
          .single();
      } else {
        // Insert new setting
        result = await supabase
          .from('ai_settings')
          .insert({ 
            name, 
            value: JSON.stringify(value),
            category: 'content_generator'
          })
          .select()
          .single();
      }
      
      if (result.error) {
        console.error(`Error updating setting ${name}:`, result.error);
        throw new Error(`Failed to update setting: ${result.error.message}`);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-content-settings'] });
      toast({
        title: 'Settings updated',
        description: 'AI content settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Initialize settings if they don't exist
  const initializeSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('name')
        .in('name', [
          'content_generator_system_prompt',
          'content_generator_temperature',
          'content_generator_max_tokens',
          'content_generator_model',
          'content_modifier_temperature'
        ]);
      
      if (error) {
        console.error('Error checking AI content settings:', error);
        setError(error.message);
        throw new Error(`Failed to check AI content settings: ${error.message}`);
      }
      
      // Create a set of existing setting names
      const existingSettings = new Set(data?.map(s => s.name));
      
      // Create settings that don't exist
      if (!existingSettings.has('content_generator_system_prompt')) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_system_prompt', 
          value: defaultSettings.systemPrompt 
        });
      }
      
      if (!existingSettings.has('content_generator_temperature')) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_temperature', 
          value: defaultSettings.temperature.toString() 
        });
      }
      
      if (!existingSettings.has('content_generator_max_tokens')) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_max_tokens', 
          value: defaultSettings.maxTokens.toString() 
        });
      }
      
      if (!existingSettings.has('content_generator_model')) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_model', 
          value: defaultSettings.model 
        });
      }
      
      if (!existingSettings.has('content_modifier_temperature')) {
        await updateSetting.mutateAsync({ 
          name: 'content_modifier_temperature', 
          value: defaultSettings.contentModifierTemperature.toString() 
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Error initializing AI content settings:', error);
      setError(error.message);
      return false;
    }
  };

  // Update settings object
  const updateSettings = async (newSettings: Partial<AIContentSettings>) => {
    try {
      if (newSettings.systemPrompt !== undefined) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_system_prompt', 
          value: newSettings.systemPrompt 
        });
      }
      
      if (newSettings.temperature !== undefined) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_temperature', 
          value: newSettings.temperature.toString() 
        });
      }
      
      if (newSettings.maxTokens !== undefined) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_max_tokens', 
          value: newSettings.maxTokens.toString() 
        });
      }
      
      if (newSettings.model !== undefined) {
        await updateSetting.mutateAsync({ 
          name: 'content_generator_model', 
          value: newSettings.model 
        });
      }
      
      if (newSettings.contentModifierTemperature !== undefined) {
        await updateSetting.mutateAsync({ 
          name: 'content_modifier_temperature', 
          value: newSettings.contentModifierTemperature.toString() 
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Error updating AI content settings:', error);
      setError(error.message);
      return false;
    }
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    error,
    updateSetting,
    initializeSettings,
    updateSettings
  };
}
