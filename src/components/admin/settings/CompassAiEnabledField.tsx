
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { AiSettingsFormValues } from "./types";

interface CompassAiEnabledFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const CompassAiEnabledField = ({ form }: CompassAiEnabledFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="compass_ai_enabled"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Enable AI Task Analysis</FormLabel>
            <FormDescription>
              Use OpenAI to analyze and prioritize tasks in the Strategic Compass
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value === "true"}
              onCheckedChange={(checked) => {
                field.onChange(checked ? "true" : "false");
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CompassAiEnabledField;
