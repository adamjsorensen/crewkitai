
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

interface MaxTokensFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const MaxTokensField = ({ form }: MaxTokensFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="ai_coach_max_tokens"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Max Tokens</FormLabel>
          <FormDescription>
            Maximum tokens in the AI response (1 to 4000)
          </FormDescription>
          <FormControl>
            <Input 
              {...field} 
              type="number" 
              min="1" 
              max="4000"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default MaxTokensField;
