
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText } from "lucide-react";
import { usePromptWizard } from "@/hooks/usePromptWizard";
import ParameterCustomization from "./wizard/ParameterCustomization";
import AdditionalContextStep from "./wizard/AdditionalContextStep";
import ReviewStep from "./wizard/ReviewStep";
import WizardNavigation from "./wizard/WizardNavigation";

interface CustomPromptWizardProps {
  promptId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomPromptWizard = ({ promptId, isOpen, onClose }: CustomPromptWizardProps) => {
  const {
    prompt,
    parameters,
    isLoading,
    generating,
    selectedTweaks,
    additionalContext,
    currentStepIndex,
    progress,
    canProceed,
    isLastStep,
    handleNext,
    handlePrevious,
    handleTweakChange,
    handleSave,
    setAdditionalContext
  } = usePromptWizard(promptId, isOpen, onClose);
  
  // Render current step content
  const renderStepContent = () => {
    if (!prompt) return null;
    
    // Parameter customization steps
    if (currentStepIndex < parameters.length) {
      const param = parameters[currentStepIndex];
      return (
        <ParameterCustomization 
          parameter={param} 
          selectedTweakId={selectedTweaks[param.id]} 
          onTweakChange={handleTweakChange}
        />
      );
    }
    
    // Additional context step
    if (currentStepIndex === parameters.length) {
      return (
        <AdditionalContextStep 
          additionalContext={additionalContext} 
          setAdditionalContext={setAdditionalContext}
        />
      );
    }
    
    // Review step
    if (currentStepIndex === parameters.length + 1) {
      return (
        <ReviewStep 
          prompt={prompt} 
          selectedTweaks={selectedTweaks}
          parameters={parameters}
          additionalContext={additionalContext}
        />
      );
    }
    
    return null;
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            {isLoading ? "Loading..." : prompt ? `Customize Prompt: ${prompt.title}` : "Customize Prompt"}
          </DialogTitle>
          <DialogDescription>
            Customize this prompt to generate content tailored to your needs
          </DialogDescription>
        </DialogHeader>
        
        <Progress value={progress} className="h-1" />
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !prompt ? (
          <div className="flex justify-center items-center py-12 text-center">
            <p className="text-muted-foreground">
              Unable to load prompt. Please try again or select a different prompt.
            </p>
          </div>
        ) : (
          <div className="min-h-[350px] py-4">
            {renderStepContent()}
          </div>
        )}
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <WizardNavigation
            currentStepIndex={currentStepIndex}
            isLastStep={isLastStep}
            canProceed={canProceed}
            generating={generating}
            isLoading={isLoading}
            promptLoaded={!!prompt}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSave={handleSave}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPromptWizard;
