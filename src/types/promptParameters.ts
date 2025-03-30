
export type PromptParameter = {
  id: string;
  name: string;
  description: string | null;
  type: 'tone_and_style' | 'audience' | 'length' | 'focus' | 'format' | 'custom';
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ParameterTweak = {
  id: string;
  parameter_id: string | null;
  name: string;
  sub_prompt: string;
  active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type PromptParameterRule = {
  id: string;
  prompt_id: string;
  parameter_id: string;
  is_active: boolean;
  is_required: boolean;
  order: number;
  created_at: string;
  updated_at: string;
};

export type ParameterWithTweaks = PromptParameter & {
  tweaks: ParameterTweak[];
  rule?: PromptParameterRule;
};
