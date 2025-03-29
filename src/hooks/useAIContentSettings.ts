
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIContentSettings {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  api_key?: string;
}

const defaultSettings: AIContentSettings = {
  model: "gpt-4o",
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
};

export const useAIContentSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['ai-content-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('name', 'content_generation_settings')
        .single();

      if (error) {
        // If settings don't exist yet, return default
        if (error.code === 'PGRST116') {
          return defaultSettings;
        }
        throw new Error(`Error fetching AI settings: ${error.message}`);
      }

      // Parse JSON if it's a string
      const valueObj = typeof data.value === 'string' 
        ? JSON.parse(data.value) 
        : data.value;
      
      // Convert string values to numbers where needed
      return {
        model: valueObj.model || defaultSettings.model,
        temperature: Number(valueObj.temperature || defaultSettings.temperature),
        max_tokens: Number(valueObj.max_tokens || defaultSettings.max_tokens),
        top_p: Number(valueObj.top_p || defaultSettings.top_p),
        frequency_penalty: Number(valueObj.frequency_penalty || defaultSettings.frequency_penalty),
        presence_penalty: Number(valueObj.presence_penalty || defaultSettings.presence_penalty),
        api_key: valueObj.api_key || undefined
      } as AIContentSettings;
    }
  });

  const updateSettings = async (newSettings: AIContentSettings) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('ai_settings')
        .upsert(
          {
            name: 'content_generation_settings',
            value: newSettings,
            category: 'content',
            description: 'AI settings for content generation'
          },
          { onConflict: 'name' }
        );

      if (error) {
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['ai-content-settings'] });
      toast({
        title: "Settings updated",
        description: "AI content generation settings have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message || "An error occurred while updating settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const initializeSettings = async () => {
    // Only initialize if settings don't already exist
    if (!settings && !isLoading) {
      await updateSettings(defaultSettings);
    }
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    isUpdating,
    updateSettings,
    initializeSettings
  };
};
