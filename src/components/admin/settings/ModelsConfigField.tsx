
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

interface ModelsConfigFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const ModelsConfigField = ({ form }: ModelsConfigFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="ai_coach_models"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-base">Models Configuration (JSON)</FormLabel>
          <FormDescription className="text-sm">
            Configure the AI models as a JSON object
          </FormDescription>
          <FormControl>
            <Textarea 
              {...field} 
              rows={4}
              className="font-mono text-sm min-h-[100px]"
              placeholder='{"default": "gpt-4o", "think": "o3-mini-2025-01-31"}'
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ModelsConfigField;
