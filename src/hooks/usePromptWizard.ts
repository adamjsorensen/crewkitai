
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";

export function usePromptWizard(promptId: string | undefined, isOpen: boolean, onClose: () => void) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPromptById } = useCrewkitPrompts();
  const { getParametersForPrompt } = useCrewkitPromptParameters();
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [parameters, setParameters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  
  // Fetch prompt when promptId changes
  useEffect(() => {
    const fetchPrompt = async () => {
      if (promptId && isOpen) {
        try {
          setIsLoading(true);
          const promptData = await getPromptById(promptId);
          setPrompt(promptData);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching prompt:", error);
          setIsLoading(false);
        }
      }
    };
    
    fetchPrompt();
  }, [promptId, isOpen, getPromptById]);
  
  // Fetch parameters for this prompt
  useEffect(() => {
    const fetchParameters = async () => {
      try {
        if (prompt?.id && isOpen) {
          setIsLoading(true);
          const params = await getParametersForPrompt(prompt.id);
          setParameters(params);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching parameters for prompt:", error);
        setIsLoading(false);
      }
    };
    
    fetchParameters();
  }, [prompt?.id, isOpen, getParametersForPrompt]);
  
  // Reset state when wizard is opened with a new prompt
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setSelectedTweaks({});
      setAdditionalContext("");
    }
  }, [isOpen, promptId]);
  
  const handleNext = () => {
    if (currentStepIndex < getSteps().length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const handleTweakChange = (parameterId: string, tweakId: string) => {
    setSelectedTweaks({
      ...selectedTweaks,
      [parameterId]: tweakId,
    });
  };
  
  const handleSave = async () => {
    if (!user || !prompt) return;
    
    setGenerating(true);
    try {
      // 1. Create a custom prompt
      const { data: customPrompt, error: customPromptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: prompt.id,
          created_by: user.id,
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
      
    } catch (error) {
      console.error("Error creating and generating custom prompt:", error);
    } finally {
      setGenerating(false);
    }
  };
  
  // Define wizard steps
  const getSteps = () => {
    if (!prompt) return [];
    
    return [
      ...(parameters.length > 0 ? parameters.map(param => ({
        title: `Customize: ${param.name}`,
        isCompleted: () => !param.rule?.is_required || !!selectedTweaks[param.id],
      })) : []),
      {
        title: "Additional Context",
        isCompleted: () => true,
      },
      {
        title: "Review",
        isCompleted: () => true,
      }
    ];
  };
  
  const steps = getSteps();
  const currentStep = steps[currentStepIndex];
  const progress = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  
  const canProceed = currentStep?.isCompleted?.() ?? true;
  const isLastStep = currentStepIndex === steps.length - 1;

  return {
    prompt,
    parameters,
    isLoading,
    generating,
    selectedTweaks,
    additionalContext,
    currentStepIndex,
    steps,
    progress,
    canProceed,
    isLastStep,
    handleNext,
    handlePrevious,
    handleTweakChange,
    handleSave,
    setAdditionalContext
  };
}
