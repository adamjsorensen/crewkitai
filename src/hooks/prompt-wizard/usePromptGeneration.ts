
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Prompt } from "@/hooks/useCrewkitPrompts";

interface PromptGenerationProps {
  prompt: Prompt | null;
  selectedTweaks: Record<string, string>;
  additionalContext: string;
  userId: string | undefined;
  onClose: () => void;
}

export function usePromptGeneration({ 
  prompt, 
  selectedTweaks, 
  additionalContext, 
  userId, 
  onClose 
}: PromptGenerationProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleSave = async () => {
    if (!userId || !prompt) return;
    
    setGenerating(true);
    try {
      // 1. Create a custom prompt
      const { data: customPrompt, error: customPromptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: prompt.id,
          created_by: userId,
        })
        .select()
        .single();
      
      if (customPromptError) throw customPromptError;
      
      // 2. Save selected tweaks
      const customizations = Object.entries(selectedTweaks).map(([_, tweakId]) => ({
        custom_prompt_id: customPrompt.id,
        parameter_tweak_id: tweakId,
      }));
      
      if (customizations.length > 0) {
        const { error: customizationsError } = await supabase
          .from('prompt_customizations')
          .insert(customizations);
        
        if (customizationsError) throw customizationsError;
      }
      
      // 3. Save additional context if provided
      if (additionalContext.trim()) {
        const { error: contextError } = await supabase
          .from('prompt_additional_context')
          .insert({
            custom_prompt_id: customPrompt.id,
            context_text: additionalContext,
          });
        
        if (contextError) throw contextError;
      }
      
      // 4. Call the edge function to generate content
      const { data: generationResult, error: generationError } = await supabase.functions.invoke(
        'crewkit-generate-content',
        {
          body: { customPromptId: customPrompt.id },
        }
      );
      
      if (generationError) throw generationError;
      
      // If successful, navigate to the generated content page
      onClose();
      navigate(`/dashboard/generated/${generationResult.generationId}`);
      
    } catch (error: any) {
      console.error("Error creating and generating custom prompt:", error);
      toast({
        title: "Error generating content",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return { generating, handleSave };
}
