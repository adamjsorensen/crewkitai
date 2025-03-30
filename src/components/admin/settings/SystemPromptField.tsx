
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
          <FormDescription className="text-sm">
            The system prompt defines how the AI coach behaves and responds
          </FormDescription>
          <FormControl>
            <Textarea 
              {...field} 
              rows={6}
              placeholder="Enter system prompt" 
              className="w-full resize-y min-h-[100px] max-h-[300px]"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SystemPromptField;
