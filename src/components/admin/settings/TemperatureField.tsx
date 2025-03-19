
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AiSettingsFormValues } from "./types";

interface TemperatureFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const TemperatureField = ({ form }: TemperatureFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="ai_coach_temperature"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Temperature</FormLabel>
          <FormDescription>
            Controls randomness (0.0 to 1.0). Lower values make responses more deterministic.
          </FormDescription>
          <FormControl>
            <Input 
              {...field} 
              type="number" 
              min="0" 
              max="1" 
              step="0.1"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TemperatureField;
