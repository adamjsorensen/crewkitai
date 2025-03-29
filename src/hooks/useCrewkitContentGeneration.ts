
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CustomPrompt = {
  id: string;
  base_prompt_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type PromptCustomization = {
  id: string;
  custom_prompt_id: string;
  parameter_tweak_id: string;
  created_at: string;
};

export type PromptAdditionalContext = {
  id: string;
  custom_prompt_id: string;
  context_text: string;
  created_at: string;
};

export type PromptGeneration = {
  id: string;
  custom_prompt_id: string;
  generated_content: string;
  created_by: string;
  created_at: string;
};

export type SavedGeneration = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  slug: string | null;
  original_generation_id: string | null;
  created_at: string;
  updated_at: string;
};

export function useCrewkitContentGeneration() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a custom prompt with selected tweaks and additional context
  const createCustomPrompt = async (
    basePromptId: string,
    selectedTweakIds: string[],
    additionalContext?: string
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Create the custom prompt
      const { data: customPrompt, error: customPromptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: basePromptId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (customPromptError) {
        throw new Error(`Failed to create custom prompt: ${customPromptError.message}`);
      }
      
      // 2. Add customizations (parameter tweak selections)
      if (selectedTweakIds.length > 0) {
        const customizations = selectedTweakIds.map(tweakId => ({
          custom_prompt_id: customPrompt.id,
          parameter_tweak_id: tweakId
        }));
        
        const { error: customizationsError } = await supabase
          .from('prompt_customizations')
          .insert(customizations);
        
        if (customizationsError) {
          throw new Error(`Failed to save customizations: ${customizationsError.message}`);
        }
      }
      
      // 3. Add additional context if provided
      if (additionalContext && additionalContext.trim() !== '') {
        const { error: contextError } = await supabase
          .from('prompt_additional_context')
          .insert({
            custom_prompt_id: customPrompt.id,
            context_text: additionalContext
          });
        
        if (contextError) {
          throw new Error(`Failed to save additional context: ${contextError.message}`);
        }
      }
      
      return customPrompt.id;
    } catch (error: any) {
      console.error('Error creating custom prompt:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate content based on a custom prompt
  const generateContent = useMutation({
    mutationFn: async (customPromptId: string) => {
      try {
        const { data, error } = await supabase.functions.invoke('crewkit-generate-content', {
          body: { customPromptId }
        });
        
        if (error) {
          throw new Error(`Failed to generate content: ${error.message}`);
        }
        
        return data as { generatedContent: string; generationId: string };
      } catch (error: any) {
        console.error('Error generating content:', error);
        throw new Error(`Failed to generate content: ${error.message}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error generating content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Modify existing content
  const modifyContent = useMutation({
    mutationFn: async ({ content, modification }: { content: string; modification: string }) => {
      try {
        const { data, error } = await supabase.functions.invoke('crewkit-modify-content', {
          body: { content, modification }
        });
        
        if (error) {
          throw new Error(`Failed to modify content: ${error.message}`);
        }
        
        return data as { modifiedContent: string };
      } catch (error: any) {
        console.error('Error modifying content:', error);
        throw new Error(`Failed to modify content: ${error.message}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error modifying content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch a specific generation
  const getGeneration = async (generationId: string) => {
    try {
      const { data, error } = await supabase
        .from('prompt_generations')
        .select(`
          *,
          custom_prompt:custom_prompt_id(
            *,
            base_prompt:base_prompt_id(*),
            customizations:prompt_customizations(
              *,
              parameter_tweak:parameter_tweak_id(
                *,
                parameter:parameter_id(*)
              )
            ),
            additional_context:prompt_additional_context(*)
          )
        `)
        .eq('id', generationId)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch generation: ${error.message}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Error fetching generation:', error);
      setError(error.message);
      throw error;
    }
  };

  // Save a generation (create a saved version)
  const saveGeneration = useMutation({
    mutationFn: async ({ 
      title, 
      content, 
      originalGenerationId = null 
    }: { 
      title: string; 
      content: string; 
      originalGenerationId?: string | null;
    }) => {
      const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .concat('-', Date.now().toString().slice(-6));
      
      const { data, error } = await supabase
        .from('saved_generations')
        .insert({
          title,
          content,
          slug,
          original_generation_id: originalGenerationId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to save generation: ${error.message}`);
      }
      
      return data as SavedGeneration;
    },
    onSuccess: () => {
      toast({
        title: 'Content saved',
        description: 'Your content has been saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error saving content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update a saved generation
  const updateSavedGeneration = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<SavedGeneration, 'title' | 'content'>>
    }) => {
      const { data, error } = await supabase
        .from('saved_generations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update saved content: ${error.message}`);
      }
      
      return data as SavedGeneration;
    },
    onSuccess: () => {
      toast({
        title: 'Content updated',
        description: 'Your content has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get all saved generations for the current user
  const getSavedGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_generations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch saved generations: ${error.message}`);
      }
      
      return data as SavedGeneration[];
    } catch (error: any) {
      console.error('Error fetching saved generations:', error);
      setError(error.message);
      throw error;
    }
  };

  // Get a specific saved generation
  const getSavedGeneration = async (slugOrId: string) => {
    try {
      let query = supabase
        .from('saved_generations')
        .select('*');
      
      // Check if the input is a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      
      if (isUuid) {
        query = query.eq('id', slugOrId);
      } else {
        query = query.eq('slug', slugOrId);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        throw new Error(`Failed to fetch saved generation: ${error.message}`);
      }
      
      return data as SavedGeneration;
    } catch (error: any) {
      console.error('Error fetching saved generation:', error);
      setError(error.message);
      throw error;
    }
  };

  // Delete a saved generation
  const deleteSavedGeneration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_generations')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Failed to delete saved generation: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: () => {
      toast({
        title: 'Content deleted',
        description: 'Your content has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting content',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    isLoading,
    error,
    createCustomPrompt,
    generateContent,
    modifyContent,
    getGeneration,
    saveGeneration,
    updateSavedGeneration,
    getSavedGenerations,
    getSavedGeneration,
    deleteSavedGeneration,
  };
}
