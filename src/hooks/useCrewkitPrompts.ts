
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Prompt = {
  id: string;
  title: string;
  description: string | null;
  prompt: string | null;
  is_category: boolean;
  parent_id: string | null;
  hub_area: 'marketing' | 'sales' | 'operations' | 'client_communications' | 'general' | null;
  icon_name: string | null;
  display_order: number;
  created_by: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePromptInput = Omit<Prompt, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePromptInput = Partial<Omit<Prompt, 'id' | 'created_at' | 'updated_at'>>;

export function useCrewkitPrompts(parentId: string | null = null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Fetch prompts with optional parent filter
  const { data, isLoading, isError } = useQuery({
    queryKey: ['prompts', parentId],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching prompts:', error);
        setError(error.message);
        throw new Error(`Failed to fetch prompts: ${error.message}`);
      }
      
      return data as Prompt[];
    },
  });

  // Create new prompt
  const createPrompt = useMutation({
    mutationFn: async (input: CreatePromptInput) => {
      const { data, error } = await supabase
        .from('prompts')
        .insert(input)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating prompt:', error);
        throw new Error(`Failed to create prompt: ${error.message}`);
      }
      
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt created',
        description: 'The prompt was created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update prompt
  const updatePrompt = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & UpdatePromptInput) => {
      const { data, error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating prompt:', error);
        throw new Error(`Failed to update prompt: ${error.message}`);
      }
      
      return data as Prompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt updated',
        description: 'The prompt was updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete prompt
  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting prompt:', error);
        throw new Error(`Failed to delete prompt: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      toast({
        title: 'Prompt deleted',
        description: 'The prompt was deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting prompt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get all prompts in a flat list
  const getAllPrompts = async () => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('is_category', false)
      .order('title', { ascending: true });
    
    if (error) {
      console.error('Error fetching all prompts:', error);
      setError(error.message);
      throw new Error(`Failed to fetch all prompts: ${error.message}`);
    }
    
    return data as Prompt[];
  };

  // Get prompt by ID
  const getPromptById = async (id: string) => {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching prompt with ID ${id}:`, error);
      setError(error.message);
      throw new Error(`Failed to fetch prompt: ${error.message}`);
    }
    
    return data as Prompt;
  };

  return {
    prompts: data || [],
    isLoading,
    isError,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    getAllPrompts,
    getPromptById,
  };
}
