
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { AiSettingsFormValues } from "./types";

interface FollowUpQuestionsFieldProps {
  form: UseFormReturn<AiSettingsFormValues>;
}

const FollowUpQuestionsField = ({ form }: FollowUpQuestionsFieldProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="ai_coach_follow_up_enabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 sm:p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-sm sm:text-base">Enable Follow-Up Suggestions</FormLabel>
              <FormDescription className="text-xs sm:text-sm">
                Display suggested follow-up questions after AI responses
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
      
      {form.watch("ai_coach_follow_up_enabled") === "true" && (
        <FormField
          control={form.control}
          name="ai_coach_follow_up_defaults"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base">Default Follow-Up Questions</FormLabel>
              <FormDescription className="text-xs sm:text-sm">
                These questions are shown if the AI doesn't generate its own suggestions
              </FormDescription>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={6}
                  placeholder='["How do I price a job properly?", "What marketing strategies work best for painters?"]'
                  className="font-mono text-xs sm:text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs sm:text-sm" />
            </FormItem>
          )}
        />
      )}
    </>
  );
};

export default FollowUpQuestionsField;
