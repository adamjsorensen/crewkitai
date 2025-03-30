
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

interface SystemPromptFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const SystemPromptField = ({ form }: SystemPromptFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="ai_coach_system_prompt"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">System Prompt</FormLabel>
          <FormDescription className="text-xs sm:text-sm">
            Defines the AI coach's personality, capabilities, and behavior for all conversations.
          </FormDescription>
          <FormControl>
            <Textarea 
              {...field} 
              rows={8}
              placeholder="Enter system prompt for AI coach" 
              className="text-sm sm:text-base"
            />
          </FormControl>
          <FormMessage className="text-xs sm:text-sm" />
        </FormItem>
      )}
    />
  );
};

export default SystemPromptField;
