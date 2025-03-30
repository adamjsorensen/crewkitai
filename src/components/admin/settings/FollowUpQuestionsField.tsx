
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AiSettingsFormValues } from "./types";

interface FollowUpQuestionsFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const FollowUpQuestionsField: React.FC<FollowUpQuestionsFieldProps> = ({ form }) => {
  const enabled = form.watch("ai_coach_follow_up_enabled") === "true";

  const handleToggleChange = (checked: boolean) => {
    form.setValue("ai_coach_follow_up_enabled", checked ? "true" : "false");
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="ai_coach_follow_up_enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Follow-up Questions</FormLabel>
              <FormDescription>
                Enable or disable automatic generation of follow-up questions after AI responses
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value === "true"}
                onCheckedChange={handleToggleChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ai_coach_follow_up_defaults"
        render={({ field }) => (
          <FormItem className={!enabled ? "opacity-50" : ""}>
            <FormLabel>Default Follow-up Questions</FormLabel>
            <FormControl>
              <Textarea
                placeholder='["How do I price a job properly?", "What marketing strategies work best for painters?"]'
                className="font-mono text-sm h-32"
                {...field}
                disabled={!enabled}
              />
            </FormControl>
            <FormDescription>
              Default follow-up questions as a JSON array of strings. These will be used when the AI fails to generate suggestions.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default FollowUpQuestionsField;
