
import { z } from "zod";

// Form schema for AI settings
export const aiSettingsFormSchema = z.object({
  ai_coach_system_prompt: z.string().min(10, {
    message: "System prompt must be at least 10 characters",
  }),
  ai_coach_temperature: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1;
    },
    {
      message: "Temperature must be a number between 0 and 1",
    }
  ),
  ai_coach_max_tokens: z.string().refine(
    (val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 4000;
    },
    {
      message: "Max tokens must be a number between 1 and 4000",
    }
  ),
  ai_coach_models: z.string().min(5, {
    message: "Model configuration is required",
  }),
  ai_coach_follow_up_enabled: z.string(),
  ai_coach_follow_up_defaults: z.string().min(5, {
    message: "Default follow-up questions are required",
  }),
  ai_coach_follow_up_prompt: z.string().min(10, {
    message: "Follow-up prompt must be at least 10 characters",
  }),
});

// Type for form values
export type AiSettingsFormValues = z.infer<typeof aiSettingsFormSchema>;
