
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { AiSettingsFormValues } from "./types";

interface CompassSystemPromptFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const CompassSystemPromptField = ({ form }: CompassSystemPromptFieldProps) => {
  // Only show if AI is enabled
  const isAiEnabled = form.watch("compass_ai_enabled") === "true";
  
  if (!isAiEnabled) {
    return null;
  }
  
  return (
    <FormField
      control={form.control}
      name="compass_ai_system_prompt"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Compass System Prompt</FormLabel>
          <FormDescription>
            The system prompt defines how the AI analyzes and prioritizes tasks
          </FormDescription>
          <FormControl>
            <Textarea 
              {...field} 
              rows={8}
              placeholder="Enter system prompt for task analysis" 
              value={field.value || `You are a strategic planning assistant for a painting business. Your job is to extract tasks from the user's input, prioritize them, and suggest due dates.`}
              className="font-mono text-sm overflow-x-auto max-w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CompassSystemPromptField;
