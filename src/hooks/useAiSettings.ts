
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AiSettingsData = Record<string, string>;

export const useAiSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AiSettingsData>({});
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      console.log("Fetching AI settings...");
      const { data, error } = await supabase
        .from("ai_settings")
        .select("name, value")
        .in("name", [
          "ai_coach_system_prompt",
          "ai_coach_temperature",
          "ai_coach_max_tokens",
          "ai_coach_models",
          "ai_coach_follow_up_enabled",
          "ai_coach_follow_up_defaults",
          "ai_coach_follow_up_prompt",
          "compass_ai_enabled",
          "compass_ai_system_prompt"
        ]);
      
      if (error) throw error;
      
      console.log("Settings fetched:", data);
      
      if (data) {
        const formValues: AiSettingsData = {};
        
        data.forEach(setting => {
          let value = setting.value;
          
          // If the value appears to be a JSON string, parse it
          if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{'))) {
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.error("Error parsing JSON value:", e);
              // Keep as is if parsing fails
            }
          }
          
          // If it's an object, stringify it for display
          if (typeof value === 'object') {
            formValues[setting.name] = JSON.stringify(value, null, 2);
          } else {
            formValues[setting.name] = String(value);
          }
        });
        
        console.log("Processed settings for form:", formValues);
        setSettings(formValues);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load AI settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, isLoading, refetchSettings: fetchSettings };
};

export const useSaveAiSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveSettings = async (values: Record<string, string>) => {
    setIsSaving(true);
    
    try {
      console.log("Saving settings:", values);
      
      // Process each setting
      for (const [key, value] of Object.entries(values)) {
        let processedValue = value;
        
        // Try to parse JSON fields
        if (key === 'ai_coach_models' || key === 'ai_coach_follow_up_defaults') {
          try {
            // Parse the JSON string to an object
            const jsonValue = JSON.parse(value);
            // Then stringify it again to ensure it's a valid JSON string for storage
            processedValue = JSON.stringify(jsonValue);
          } catch (e) {
            console.error(`Invalid JSON for ${key}:`, e);
            toast({
              title: "Invalid JSON",
              description: `${key} must be valid JSON`,
              variant: "destructive",
            });
            setIsSaving(false);
            return false;
          }
        } else if (key === 'ai_coach_follow_up_enabled' || key === 'compass_ai_enabled') {
          // For boolean values stored as strings, just pass as is
          processedValue = value;
        } else {
          // For string values like system prompt, wrap in quotes to make it a JSON string
          processedValue = JSON.stringify(value);
        }
        
        console.log(`Updating setting ${key}:`, processedValue);
        
        // Check if the setting already exists
        const { data: existingData, error: checkError } = await supabase
          .from("ai_settings")
          .select("name")
          .eq("name", key);
          
        if (checkError) {
          console.error(`Error checking if ${key} exists:`, checkError);
          throw checkError;
        }
        
        if (existingData && existingData.length > 0) {
          // Update existing setting
          const { error } = await supabase
            .from("ai_settings")
            .update({ value: processedValue })
            .eq("name", key);
          
          if (error) {
            console.error(`Error updating ${key}:`, error);
            throw error;
          }
        } else {
          // Insert new setting
          const { error } = await supabase
            .from("ai_settings")
            .insert({ name: key, value: processedValue });
          
          if (error) {
            console.error(`Error inserting ${key}:`, error);
            throw error;
          }
        }
      }
      
      toast({
        title: "Settings Updated",
        description: "AI settings have been successfully updated",
      });
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update AI settings",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveSettings, isSaving };
};
