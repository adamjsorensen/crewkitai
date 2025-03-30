
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FileText } from "lucide-react";
import { usePromptWizard } from "@/hooks/usePromptWizard";
import WizardNavigation from "./wizard/WizardNavigation";
import LoadingState from "./wizard/LoadingState";
import ErrorAndRetryState from "./wizard/ErrorAndRetryState";
import NetworkStatusAlert from "./wizard/NetworkStatusAlert";
import WizardContent from "./wizard/WizardContent";
import NetworkStatusMonitor from "./wizard/NetworkStatusMonitor";
import { useToast } from "@/hooks/use-toast";

interface CustomPromptWizardProps {
  promptId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CustomPromptWizard = ({ promptId, isOpen, onClose }: CustomPromptWizardProps) => {
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  
  const {
    prompt,
    parameters,
    isLoading,
    error,
    generating,
    selectedTweaks,
    additionalContext,
    currentStepIndex,
    progressValue,
    canProceed,
    isLastStep,
    handleNext,
    handlePrevious,
    handleTweakChange,
    handleSave,
    setAdditionalContext,
    refetchPrompt
  } = usePromptWizard(promptId, isOpen, onClose, retryCount);
  
  // Handle retry with exponential backoff
  const handleRetry = () => {
    console.log("Retrying prompt fetch...");
    setRetryCount(prev => prev + 1);
    toast({
      title: "Retrying",
      description: "Attempting to load the prompt again",
    });
    
    refetchPrompt();
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
        
        <Progress value={progressValue} className="h-1" />
        
        <NetworkStatusMonitor onStatusChange={setNetworkStatus} />
        <NetworkStatusAlert networkStatus={networkStatus} />
        
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorAndRetryState 
            error={error} 
            onClose={onClose} 
            onRetry={handleRetry} 
            networkStatus={networkStatus}
          />
        ) : !prompt ? (
          <ErrorAndRetryState 
            error="Unable to load prompt details."
            onClose={onClose} 
            onRetry={handleRetry} 
            networkStatus={networkStatus}
            errorType="not-found"
          />
        ) : (
          <div className="min-h-[350px] py-4">
            <WizardContent
              prompt={prompt}
              parameters={parameters}
              currentStepIndex={currentStepIndex}
              selectedTweaks={selectedTweaks}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              handleTweakChange={handleTweakChange}
            />
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
            networkStatus={networkStatus}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPromptWizard;
