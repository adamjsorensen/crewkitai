import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CustomPromptWizardProps {
  promptId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomPromptWizard = ({ promptId, isOpen, onClose }: CustomPromptWizardProps) => {
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
          const promptData = await getPromptById(promptId);
          setPrompt(promptData);
        } catch (error) {
          console.error("Error fetching prompt:", error);
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
  }, [isOpen, prompt?.id]);
  
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
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
    if (!user) return;
    
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
  const steps = [
    ...(parameters.length > 0 ? parameters.map(param => ({
      title: `Customize: ${param.name}`,
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{param.name}</h3>
          {param.description && (
            <p className="text-sm text-muted-foreground">{param.description}</p>
          )}
          
          <RadioGroup 
            value={selectedTweaks[param.id] || ''} 
            onValueChange={(value) => handleTweakChange(param.id, value)}
          >
            <div className="space-y-2">
              {param.tweaks && param.tweaks.length > 0 ? (
                param.tweaks.map((tweak: any) => (
                  <div key={tweak.id} className="flex items-start space-x-2 p-3 border rounded-md">
                    <RadioGroupItem id={tweak.id} value={tweak.id} />
                    <div className="flex-1">
                      <Label htmlFor={tweak.id} className="font-medium cursor-pointer">
                        {tweak.name}
                      </Label>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No options available for this parameter.
                </p>
              )}
            </div>
          </RadioGroup>
          
          {param.rule?.is_required && !selectedTweaks[param.id] && (
            <p className="text-sm text-red-500">
              This selection is required.
            </p>
          )}
        </div>
      ),
      isCompleted: () => !param.rule?.is_required || !!selectedTweaks[param.id],
    })) : []),
    {
      title: "Additional Context",
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Context</h3>
          <p className="text-sm text-muted-foreground">
            Provide any specific details or information you want included in the generated content.
          </p>
          <Textarea
            placeholder="Enter additional context here..."
            className="min-h-[150px]"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
          />
        </div>
      ),
      isCompleted: () => true,
    },
    {
      title: "Review",
      component: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Review Your Selections</h3>
          <div className="rounded-md border p-4 space-y-3">
            <div>
              <h4 className="font-medium">Base Prompt</h4>
              <p className="text-sm text-muted-foreground">{prompt.title}</p>
            </div>
            
            <Separator />
            
            {Object.entries(selectedTweaks).length > 0 && (
              <div>
                <h4 className="font-medium">Selected Customizations</h4>
                <ul className="mt-2 space-y-1">
                  {Object.entries(selectedTweaks).map(([paramId, tweakId]) => {
                    const param = parameters.find(p => p.id === paramId);
                    const tweak = param?.tweaks.find((t: any) => t.id === tweakId);
                    return (
                      <li key={paramId} className="text-sm">
                        <span className="font-medium">{param?.name}:</span>{" "}
                        <span className="text-muted-foreground">{tweak?.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            {additionalContext && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium">Additional Context</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                    {additionalContext}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      ),
      isCompleted: () => true,
    }
  ];
  
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  const canProceed = currentStep?.isCompleted?.() ?? true;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            Customize Prompt: {prompt?.title}
          </DialogTitle>
        </DialogHeader>
        
        <Progress value={progress} className="h-1" />
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="min-h-[350px] py-4">
            {currentStep?.component}
          </div>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0 || generating}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div>
            {isLastStep ? (
              <Button 
                onClick={handleSave} 
                disabled={!canProceed || generating}
                className="min-w-[100px]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Content'
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleNext} 
                disabled={!canProceed || generating}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPromptWizard;
