
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader, Sparkles, Wand2 } from "lucide-react";
import { useCrewkitPromptParameters, ParameterWithTweaks, ParameterTweak } from "@/hooks/useCrewkitPromptParameters";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomPromptWizardProps {
  promptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomPromptWizard = ({ promptId, open, onOpenChange }: CustomPromptWizardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getParametersForPrompt } = useCrewkitPromptParameters();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [parameters, setParameters] = useState<ParameterWithTweaks[]>([]);
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState("");
  
  useEffect(() => {
    if (open && promptId) {
      loadParameters();
    }
  }, [open, promptId]);
  
  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const params = await getParametersForPrompt(promptId);
      setParameters(params);
      // Initialize selectedTweaks with empty values
      const initialTweaks: Record<string, string> = {};
      params.forEach(param => {
        if (param.tweaks?.length > 0) {
          initialTweaks[param.id] = "";
        }
      });
      setSelectedTweaks(initialTweaks);
    } catch (error) {
      console.error("Error loading parameters:", error);
      toast({
        title: "Error",
        description: "Failed to load parameters for prompt customization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTweakSelection = (parameterId: string, tweakId: string) => {
    setSelectedTweaks(prev => ({ ...prev, [parameterId]: tweakId }));
  };
  
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Create custom prompt
      const { data: customPrompt, error: promptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: promptId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (promptError) throw new Error(`Error creating custom prompt: ${promptError.message}`);
      
      // 2. Save parameter tweaks selections
      const customizationPromises = Object.entries(selectedTweaks)
        .filter(([_, tweakId]) => tweakId) // Only save non-empty selections
        .map(([parameterId, tweakId]) => 
          supabase
            .from('prompt_customizations')
            .insert({
              custom_prompt_id: customPrompt.id,
              parameter_tweak_id: tweakId
            })
        );
      
      // 3. Save additional context if provided
      if (additionalContext.trim()) {
        customizationPromises.push(
          supabase
            .from('prompt_additional_context')
            .insert({
              custom_prompt_id: customPrompt.id,
              context_text: additionalContext.trim()
            })
        );
      }
      
      // 4. Execute all customization promises
      await Promise.all(customizationPromises);
      
      // 5. Generate content
      const response = await supabase.functions.invoke('crewkit-generate-content', {
        body: { customPromptId: customPrompt.id }
      });
      
      if (response.error) throw new Error(`Error generating content: ${response.error.message}`);
      
      // 6. Close wizard and navigate to generated content
      onOpenChange(false);
      navigate(`/dashboard/generated/${response.data.generationId}`);
      
      toast({
        title: "Content Generated",
        description: "Your content has been successfully generated",
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while generating content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const ParameterStep = ({ parameter }: { parameter: ParameterWithTweaks }) => {
    if (!parameter.tweaks || parameter.tweaks.length === 0) {
      return <p>No options available for this parameter.</p>;
    }
    
    const isRequired = parameter.rule?.is_required;
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{parameter.name}</h3>
          {parameter.description && (
            <p className="text-sm text-muted-foreground">{parameter.description}</p>
          )}
          {isRequired && (
            <p className="text-sm text-destructive mt-1">* Required</p>
          )}
        </div>
        
        <RadioGroup
          value={selectedTweaks[parameter.id] || ""}
          onValueChange={(value) => handleTweakSelection(parameter.id, value)}
        >
          <div className="grid grid-cols-1 gap-3">
            {parameter.tweaks.map((tweak) => (
              <Label
                key={tweak.id}
                className="flex items-start space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover:bg-accent"
              >
                <RadioGroupItem value={tweak.id} className="mt-1" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-medium">{tweak.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {tweak.sub_prompt}
                  </div>
                </div>
              </Label>
            ))}
            
            {!isRequired && (
              <Label
                className="flex items-start space-x-3 space-y-0 rounded-md border p-3 cursor-pointer hover:bg-accent"
              >
                <RadioGroupItem value="" className="mt-1" />
                <div className="space-y-1.5 flex-1">
                  <div className="font-medium">Skip this parameter</div>
                  <div className="text-sm text-muted-foreground">
                    Don't include any specific {parameter.name.toLowerCase()} customization
                  </div>
                </div>
              </Label>
            )}
          </div>
        </RadioGroup>
      </div>
    );
  };
  
  const AdditionalContextStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Additional Context</h3>
        <p className="text-sm text-muted-foreground">
          Add any specific details or instructions that should be included in your content
        </p>
      </div>
      
      <Textarea
        placeholder="Enter additional context, specific requirements, or information about your business..."
        className="min-h-[200px]"
        value={additionalContext}
        onChange={(e) => setAdditionalContext(e.target.value)}
      />
    </div>
  );
  
  const ReviewStep = () => {
    // Get the selected tweaks with their details
    const selectedTweakDetails: { parameter: string; tweak: string }[] = [];
    
    parameters.forEach(param => {
      const tweakId = selectedTweaks[param.id];
      if (tweakId) {
        const tweak = param.tweaks.find(t => t.id === tweakId);
        if (tweak) {
          selectedTweakDetails.push({
            parameter: param.name,
            tweak: tweak.name
          });
        }
      }
    });
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Review Your Selections</h3>
          <p className="text-sm text-muted-foreground">
            Review your customization choices before generating content
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Selected Customizations:</h4>
              {selectedTweakDetails.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {selectedTweakDetails.map((item, index) => (
                    <li key={index}>
                      <span className="font-medium">{item.parameter}:</span> {item.tweak}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No customizations selected.</p>
              )}
            </div>
            
            {additionalContext && (
              <div>
                <h4 className="text-sm font-medium mb-2">Additional Context:</h4>
                <p className="text-sm bg-muted p-3 rounded">
                  {additionalContext}
                </p>
              </div>
            )}
            
            {selectedTweakDetails.length === 0 && !additionalContext && (
              <div className="text-amber-500 text-sm">
                Warning: You haven't selected any customizations or provided additional context.
                Your generated content will use the default prompt settings.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Define wizard steps
  const steps = [
    ...parameters.map(param => ({
      label: param.name,
      content: <ParameterStep parameter={param} />
    })),
    {
      label: "Additional Context",
      content: <AdditionalContextStep />
    },
    {
      label: "Review",
      content: <ReviewStep />
    }
  ];
  
  // Check if we can proceed to next step
  const canProceed = () => {
    if (currentStepIndex < parameters.length) {
      const param = parameters[currentStepIndex];
      // If the parameter is required, check if a tweak is selected
      return !param.rule?.is_required || !!selectedTweaks[param.id];
    }
    return true;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Customize Your Content</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={`step-${currentStepIndex}`} className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="step-parameters" disabled>Parameters</TabsTrigger>
                <TabsTrigger value="step-context" disabled>Context</TabsTrigger>
                <TabsTrigger value="step-review" disabled>Review</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="min-h-[300px]">
              {steps[currentStepIndex]?.content || <div>Loading...</div>}
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              {currentStepIndex < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Content</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomPromptWizard;
