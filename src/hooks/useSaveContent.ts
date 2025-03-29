
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

interface SaveGenerationParams {
  title: string;
  content: string;
  originalGenerationId?: string;
  slug?: string;
}

interface UpdateSavedContentParams {
  id: string;
  title?: string;
  content?: string;
}

export function useSaveContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // Create a slug from the title
  const createSlug = (title: string): string => {
    return `${title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)}-${uuidv4().substring(0, 8)}`;
  };

  // Save a new generation to saved_generations
  const saveGeneration = async ({ 
    title, 
    content, 
    originalGenerationId,
    slug = ''
  }: SaveGenerationParams) => {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create a slug if not provided
      const contentSlug = slug || createSlug(title);

      const { data, error } = await supabase
        .from('saved_generations')
        .insert({
          user_id: userId,
          title,
          content,
          slug: contentSlug,
          original_generation_id: originalGenerationId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, slug: data.slug };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update existing saved content
  const updateSavedContent = useMutation({
    mutationFn: async ({ id, title, content }: UpdateSavedContentParams) => {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      updates.updated_at = new Date();

      const { data, error } = await supabase
        .from('saved_generations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
      toast({
        title: 'Content updated',
        description: 'Your content has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete saved content
  const deleteSavedContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
      toast({
        title: 'Content deleted',
        description: 'The content has been deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get all saved content for the current user
  const getSavedContentList = async () => {
    try {
      const user = supabase.auth.getUser();
      const userId = (await user).data.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Get a specific saved content by slug
  const getSavedContentBySlug = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    saveGeneration,
    updateSavedContent,
    deleteSavedContent,
    getSavedContentList,
    getSavedContentBySlug,
    error
  };
}
