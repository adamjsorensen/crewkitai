
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
      const { data, error } = await supabase
        .from("ai_settings")
        .select("name, value")
        .in("name", [
          "ai_coach_system_prompt",
          "ai_coach_temperature",
          "ai_coach_max_tokens",
          "ai_coach_models",
          "ai_coach_follow_up_enabled",
          "ai_coach_follow_up_defaults"
        ]);
      
      if (error) throw error;
      
      if (data) {
        const formValues: AiSettingsData = {};
        
        data.forEach(setting => {
          let value = setting.value;
          // If the value appears to be a JSON string, parse it
          if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{'))) {
            try {
              value = JSON.parse(value);
            } catch (e) {
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

  return { settings, isLoading };
};

export const useSaveAiSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const saveSettings = async (values: Record<string, string>) => {
    setIsSaving(true);
    
    try {
      // Process each setting
      for (const [key, value] of Object.entries(values)) {
        let processedValue = value;
        
        // Try to parse JSON fields
        if (key === 'ai_coach_models' || key === 'ai_coach_follow_up_defaults') {
          try {
            processedValue = JSON.parse(value);
          } catch (e) {
            toast({
              title: "Invalid JSON",
              description: `${key} must be valid JSON`,
              variant: "destructive",
            });
            setIsSaving(false);
            return false;
          }
        }
        
        // Update the setting
        const { error } = await supabase
          .from("ai_settings")
          .update({ value: processedValue })
          .eq("name", key);
        
        if (error) throw error;
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
