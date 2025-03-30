
import { PromptParameter, ParameterTweak, PromptParameterRule, ParameterWithTweaks } from "@/types/promptParameters";

// Re-export the types
export type { PromptParameter, ParameterTweak, PromptParameterRule, ParameterWithTweaks };

// New types for the hooks
export type CreateParameterInput = Omit<PromptParameter, 'id' | 'created_at' | 'updated_at'>;
export type UpdateParameterInput = Partial<Omit<PromptParameter, 'id' | 'created_at' | 'updated_at'>> & { id: string };

export type CreateTweakInput = Omit<ParameterTweak, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTweakInput = Partial<Omit<ParameterTweak, 'id' | 'created_at' | 'updated_at'>> & { id: string };

export type CreateParameterRuleInput = Omit<PromptParameterRule, 'id' | 'created_at' | 'updated_at'>;
export type UpdateParameterRuleInput = Partial<Omit<PromptParameterRule, 'id' | 'created_at' | 'updated_at'>> & { id: string };
