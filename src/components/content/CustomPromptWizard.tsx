
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useCrewkitPromptParameters, ParameterWithTweaks } from "@/hooks/useCrewkitPromptParameters";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader, SparklesIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomPromptWizardProps {
  promptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 'parameters' | 'additional-context' | 'review' | 'generating';

const CustomPromptWizard = ({ promptId, open, onOpenChange }: CustomPromptWizardProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('parameters');
  const [selectedTweaks, setSelectedTweaks] = useState<Record<string, string>>({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [currentParameterIndex, setCurrentParameterIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { getParametersForPrompt } = useCrewkitPromptParameters();
  const [parametersWithTweaks, setParametersWithTweaks] = useState<ParameterWithTweaks[]>([]);
  
  React.useEffect(() => {
    if (open && promptId) {
      // Reset state when dialog opens
      setCurrentStep('parameters');
      setSelectedTweaks({});
      setAdditionalContext('');
      setCurrentParameterIndex(0);
      
      // Load parameters with tweaks for this prompt
      const loadParameters = async () => {
        try {
          const params = await getParametersForPrompt(promptId);
          setParametersWithTweaks(params);
        } catch (error) {
          console.error('Error loading parameters:', error);
          toast({
            title: 'Error loading customization options',
            description: 'Could not load customization options for this prompt',
            variant: 'destructive',
          });
        }
      };
      
      loadParameters();
    }
  }, [open, promptId, getParametersForPrompt, toast]);
  
  const currentParameter = parametersWithTweaks[currentParameterIndex];
  const isLastParameter = currentParameterIndex === parametersWithTweaks.length - 1;
  
  const handleTweakSelection = (parameterId: string, tweakId: string) => {
    setSelectedTweaks({
      ...selectedTweaks,
      [parameterId]: tweakId,
    });
  };
  
  const handleNextParameter = () => {
    if (isLastParameter) {
      setCurrentStep('additional-context');
    } else {
      setCurrentParameterIndex(currentParameterIndex + 1);
    }
  };
  
  const handlePreviousParameter = () => {
    if (currentParameterIndex > 0) {
      setCurrentParameterIndex(currentParameterIndex - 1);
    }
  };
  
  const handleSkipParameter = () => {
    if (isLastParameter) {
      setCurrentStep('additional-context');
    } else {
      setCurrentParameterIndex(currentParameterIndex + 1);
    }
  };
  
  const handleBackToParameters = () => {
    setCurrentStep('parameters');
    setCurrentParameterIndex(parametersWithTweaks.length - 1);
  };
  
  const handleContinueToReview = () => {
    setCurrentStep('review');
  };
  
  const handleBackToContext = () => {
    setCurrentStep('additional-context');
  };
  
  const handleGenerateContent = async () => {
    setIsLoading(true);
    setCurrentStep('generating');
    
    try {
      // Create a custom prompt record
      const { data: customPrompt, error: customPromptError } = await supabase
        .from('custom_prompts')
        .insert({
          base_prompt_id: promptId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (customPromptError) {
        throw new Error(`Failed to create custom prompt: ${customPromptError.message}`);
      }
      
      // Save selected tweaks
      const tweakInserts = Object.entries(selectedTweaks).map(([parameterId, tweakId]) => ({
        custom_prompt_id: customPrompt.id,
        parameter_tweak_id: tweakId,
      }));
      
      if (tweakInserts.length > 0) {
        const { error: tweaksError } = await supabase
          .from('prompt_customizations')
          .insert(tweakInserts);
        
        if (tweaksError) {
          throw new Error(`Failed to save parameter selections: ${tweaksError.message}`);
        }
      }
      
      // Save additional context if provided
      if (additionalContext.trim()) {
        const { error: contextError } = await supabase
          .from('prompt_additional_context')
          .insert({
            custom_prompt_id: customPrompt.id,
            context_text: additionalContext.trim()
          });
        
        if (contextError) {
          throw new Error(`Failed to save additional context: ${contextError.message}`);
        }
      }
      
      // Generate content using Supabase Edge Function
      const { data: generationData, error: generationError } = await supabase.functions
        .invoke('crewkit-generate-content', {
          body: {
            customPromptId: customPrompt.id
          }
        });
      
      if (generationError) {
        throw new Error(`Error generating content: ${generationError.message}`);
      }
      
      // Navigate to the generated content page
      navigate(`/dashboard/generated/${generationData.generationId}`);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error in content generation:', error);
      toast({
        title: 'Error generating content',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setCurrentStep('review');
      setIsLoading(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 'parameters':
        if (parametersWithTweaks.length === 0) {
          return (
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          );
        }
        
        if (!currentParameter) {
          return (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No customization options available for this prompt</p>
              <Button className="mt-4" onClick={() => setCurrentStep('additional-context')}>
                Continue
              </Button>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium">
                Customize: {currentParameter.name}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {currentParameter.description || `Select an option for ${currentParameter.name}`}
              </p>
              
              <RadioGroup
                value={selectedTweaks[currentParameter.id] || ''}
                onValueChange={(value) => handleTweakSelection(currentParameter.id, value)}
                className="space-y-3"
              >
                {currentParameter.tweaks?.map((tweak) => (
                  <div key={tweak.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-accent">
                    <RadioGroupItem value={tweak.id} id={tweak.id} className="mt-1" />
                    <div className="space-y-1.5 cursor-pointer" onClick={() => handleTweakSelection(currentParameter.id, tweak.id)}>
                      <Label htmlFor={tweak.id} className="font-medium">{tweak.name}</Label>
                      <p className="text-sm text-muted-foreground">{tweak.sub_prompt}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );
        
      case 'additional-context':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium">Additional Context</h4>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Provide any additional context or specific information to include in the generated content
              </p>
              
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Enter any specific details, company information, or context to include in the content..."
                className="h-32"
              />
            </div>
          </div>
        );
        
      case 'review':
        return (
          <div className="space-y-6">
            <h4 className="text-lg font-medium">Review Your Customizations</h4>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {Object.entries(selectedTweaks).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Selected Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(selectedTweaks).map(([parameterId, tweakId]) => {
                          const parameter = parametersWithTweaks.find(p => p.id === parameterId);
                          const tweak = parameter?.tweaks.find(t => t.id === tweakId);
                          return (
                            <div key={parameterId} className="space-y-1">
                              <div className="text-sm font-medium">{parameter?.name}:</div>
                              <div className="text-sm text-muted-foreground pl-3">{tweak?.name}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {additionalContext && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Additional Context</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm whitespace-pre-wrap">{additionalContext}</div>
                    </CardContent>
                  </Card>
                )}
                
                {Object.entries(selectedTweaks).length === 0 && !additionalContext && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No customizations added. The base prompt will be used as-is.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );
        
      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader className="h-10 w-10 animate-spin text-primary" />
            <h3 className="mt-4 text-xl font-semibold">Generating Content</h3>
            <p className="text-center text-muted-foreground mt-2">
              Please wait while we generate your content using AI...
            </p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const renderFooter = () => {
    switch (currentStep) {
      case 'parameters':
        return (
          <>
            <Button
              variant="outline"
              onClick={handleSkipParameter}
              disabled={parametersWithTweaks.length === 0}
            >
              Skip
            </Button>
            <div className="flex gap-2">
              {currentParameterIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePreviousParameter}
                >
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNextParameter}
                disabled={
                  parametersWithTweaks.length === 0 ||
                  (currentParameter?.rule?.is_required && !selectedTweaks[currentParameter?.id])
                }
              >
                {isLastParameter ? 'Continue' : 'Next'}
              </Button>
            </div>
          </>
        );
        
      case 'additional-context':
        return (
          <>
            <Button
              variant="outline"
              onClick={handleBackToParameters}
              disabled={parametersWithTweaks.length === 0}
            >
              Back
            </Button>
            <Button onClick={handleContinueToReview}>
              Continue
            </Button>
          </>
        );
        
      case 'review':
        return (
          <>
            <Button
              variant="outline"
              onClick={handleBackToContext}
            >
              Back
            </Button>
            <Button 
              onClick={handleGenerateContent}
              className="gap-1.5"
              disabled={isLoading}
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Generate Content</span>
            </Button>
          </>
        );
        
      case 'generating':
        return null;
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Prompt</DialogTitle>
          <DialogDescription>
            Tailor this prompt to your specific needs before generating content
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderStepContent()}
        </div>
        
        <DialogFooter className="flex justify-between">
          {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPromptWizard;
