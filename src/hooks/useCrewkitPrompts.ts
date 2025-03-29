
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Prompt {
  id: string;
  title: string;
  description: string | null;
  is_category: boolean;
  prompt: string | null;
  parent_id: string | null;
  hub_area: string | null;
  icon_name: string | null;
  display_order: number;
  created_by: string | null;
  is_default: boolean;
}

export const useCrewkitPrompts = (parentId: string | null = null) => {
  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ['prompts', parentId],
    queryFn: async () => {
      const query = supabase
        .from('prompts')
        .select('*');
      
      if (parentId) {
        query.eq('parent_id', parentId);
      } else {
        query.is('parent_id', null);
      }
      
      const { data, error } = await query.order('display_order');
      
      if (error) {
        throw new Error(`Failed to fetch prompts: ${error.message}`);
      }
      
      return data as Prompt[];
    }
  });

  return {
    prompts: prompts || [],
    isLoading,
    error
  };
};
