
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLogActivity } from '@/hooks/useLogActivity';

interface GenerateContentParams {
  customPromptId: string;
}

interface ModifyContentParams {
  content: string;
  modification: string;
}

export function useCrewkitContentGeneration() {
  const { toast } = useToast();
  const logActivity = useLogActivity();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate content using the edge function
  const generateContent = useMutation({
    mutationFn: async ({ customPromptId }: GenerateContentParams) => {
      setIsGenerating(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('crewkit-generate-content', {
          body: { customPromptId }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Log the activity
        await logActivity({
          actionType: 'content_generated',
          details: {
            promptId: customPromptId,
            generationId: data.generationId
          }
        });
        
        return { 
          generatedContent: data.generatedContent, 
          generationId: data.generationId 
        };
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error generating content",
          description: err.message,
          variant: "destructive"
        });
        throw err;
      } finally {
        setIsGenerating(false);
      }
    }
  });

  // Modify content using the edge function
  const modifyContent = useMutation({
    mutationFn: async ({ content, modification }: ModifyContentParams) => {
      setIsModifying(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('crewkit-modify-content', {
          body: { content, modification }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Log the activity
        await logActivity({
          actionType: 'content_modified',
          details: {
            originalLength: content.length,
            modifiedLength: data.modifiedContent.length,
            modification
          }
        });
        
        return { modifiedContent: data.modifiedContent };
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error modifying content",
          description: err.message,
          variant: "destructive"
        });
        throw err;
      } finally {
        setIsModifying(false);
      }
    }
  });

  return {
    generateContent,
    modifyContent,
    isGenerating,
    isModifying,
    error
  };
}
