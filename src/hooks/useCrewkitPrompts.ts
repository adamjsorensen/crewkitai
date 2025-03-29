
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type HubAreaType = "marketing" | "sales" | "operations" | "client_communications" | "general" | null;

export interface Prompt {
  id: string;
  title: string;
  description: string | null;
  is_category: boolean;
  prompt: string | null;
  parent_id: string | null;
  hub_area: HubAreaType;
  icon_name: string | null;
  display_order: number;
  created_by: string | null;
  is_default: boolean;
}

export const useCrewkitPrompts = (parentId: string | null = null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch prompts based on parentId
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

  // Get a specific prompt by ID
  const getPromptById = async (id: string): Promise<Prompt | null> => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching prompt:', error);
        return null;
      }
      
      return data as Prompt;
    } catch (error) {
      console.error('Error in getPromptById:', error);
      return null;
    }
  };

  // Create a new prompt
  const createPrompt = useMutation({
    mutationFn: async (promptData: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('prompts')
        .insert(promptData)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create prompt: ${error.message}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: "Prompt created",
        description: `${data.is_category ? 'Category' : 'Prompt'} "${data.title}" has been created`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update an existing prompt
  const updatePrompt = useMutation({
    mutationFn: async ({ id, ...promptData }: Prompt) => {
      const { data, error } = await supabase
        .from('prompts')
        .update(promptData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(`Failed to update prompt: ${error.message}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: "Prompt updated",
        description: `${data.is_category ? 'Category' : 'Prompt'} "${data.title}" has been updated`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete a prompt
  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete prompt: ${error.message}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: "Prompt deleted",
        description: "The prompt has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting prompt",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    prompts: prompts || [],
    isLoading,
    error,
    getPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt
  };
};
