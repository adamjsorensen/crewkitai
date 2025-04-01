
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
    if (!userId || !prompt) {
      toast({
        title: "Error",
        description: "Missing user ID or prompt data",
        variant: "destructive"
      });
      return;
    }
    
    setGenerating(true);
    try {
      console.log("Starting content generation process...");
      
      // 1. Create a custom prompt
      const { data: customPrompt, error: customPromptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: prompt.id,
          created_by: userId,
        })
        .select()
        .single();
      
      if (customPromptError) {
        console.error("Error creating custom prompt:", customPromptError);
        throw new Error(`Failed to create custom prompt: ${customPromptError.message}`);
      }
      
      console.log("Created custom prompt:", customPrompt.id);
      
      // 2. Save selected tweaks
      const customizations = Object.entries(selectedTweaks).map(([_, tweakId]) => ({
        custom_prompt_id: customPrompt.id,
        parameter_tweak_id: tweakId,
      }));
      
      if (customizations.length > 0) {
        console.log("Saving customizations:", customizations.length);
        const { error: customizationsError } = await supabase
          .from('prompt_customizations')
          .insert(customizations);
        
        if (customizationsError) {
          console.error("Error saving customizations:", customizationsError);
          throw new Error(`Failed to save customizations: ${customizationsError.message}`);
        }
      }
      
      // 3. Save additional context if provided
      if (additionalContext.trim()) {
        console.log("Saving additional context");
        const { error: contextError } = await supabase
          .from('prompt_additional_context')
          .insert({
            custom_prompt_id: customPrompt.id,
            context_text: additionalContext,
          });
        
        if (contextError) {
          console.error("Error saving additional context:", contextError);
          throw new Error(`Failed to save additional context: ${contextError.message}`);
        }
      }
      
      // 4. Call the edge function to generate content
      console.log("Calling edge function to generate content");
      const { data: generationResult, error: generationError } = await supabase.functions.invoke(
        'crewkit-generate-content',
        {
          body: { customPromptId: customPrompt.id },
        }
      );
      
      if (generationError) {
        console.error("Edge function error:", generationError);
        throw new Error(`Content generation failed: ${generationError.message}`);
      }
      
      if (!generationResult) {
        throw new Error("No content was generated");
      }
      
      console.log("Content generated successfully:", generationResult);
      
      // If successful, navigate to the generated content page
      toast({
        title: "Content Generated",
        description: "Your content was successfully generated",
      });
      
      onClose();
      navigate(`/dashboard/generated/${generationResult.generationId}`);
      
    } catch (error: any) {
      console.error("Error in content generation process:", error);
      
      // More descriptive error message based on the error
      let errorMessage = "An unexpected error occurred";
      
      if (error.message.includes("OPENAI_API_KEY")) {
        errorMessage = "OpenAI API key is missing or invalid. Please contact the administrator.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (error.message.includes("customPromptId")) {
        errorMessage = "Invalid prompt configuration. Please try a different prompt.";
      } else {
        errorMessage = error.message || "Content generation failed";
      }
      
      toast({
        title: "Error generating content",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return { generating, handleSave };
}
