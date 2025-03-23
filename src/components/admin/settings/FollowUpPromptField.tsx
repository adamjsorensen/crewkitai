
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AiSettingsFormValues } from "./types";

interface FollowUpPromptFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const FollowUpPromptField: React.FC<FollowUpPromptFieldProps> = ({ form }) => {
  const enabled = form.watch("ai_coach_follow_up_enabled") === "true";

  return (
    <FormField
      control={form.control}
      name="ai_coach_follow_up_prompt"
      render={({ field }) => (
        <FormItem className={!enabled ? "opacity-50" : ""}>
          <FormLabel>Follow-up Question Prompt</FormLabel>
          <FormControl>
            <Textarea
              placeholder="After your response, suggest 2-3 follow-up questions that would be helpful for the user to continue the conversation."
              className="h-24"
              {...field}
              disabled={!enabled}
            />
          </FormControl>
          <FormDescription>
            This prompt instructs the AI on how to generate follow-up questions after its response.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FollowUpPromptField;
