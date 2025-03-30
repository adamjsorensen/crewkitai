
export type HubAreaType = 'marketing' | 'sales' | 'operations' | 'client_communications' | 'general' | null;

export type Prompt = {
  id: string;
  title: string;
  description: string | null;
  prompt: string | null;
  is_category: boolean;
  parent_id: string | null;
  hub_area: HubAreaType;
  icon_name: string | null;
  display_order: number;
  created_by: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePromptInput = Omit<Prompt, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePromptInput = Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at'>>;
