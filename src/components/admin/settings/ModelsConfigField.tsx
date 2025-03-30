
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
          <FormLabel className="text-base">Models Configuration</FormLabel>
          <FormDescription className="text-xs sm:text-sm">
            JSON configuration for which models to use in different scenarios. The default model is used for most interactions.
          </FormDescription>
          <FormControl>
            <Textarea 
              {...field} 
              rows={5}
              placeholder='{"default": "gpt-4o-mini", "think": "gpt-4o"}'
              className="font-mono text-xs sm:text-sm"
            />
          </FormControl>
          <FormMessage className="text-xs sm:text-sm" />
        </FormItem>
      )}
    />
  );
};

export default ModelsConfigField;
