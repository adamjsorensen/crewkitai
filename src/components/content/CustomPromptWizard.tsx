
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, AlertTriangle, HelpCircle, RefreshCw, WifiOff } from "lucide-react";
import { usePromptWizard } from "@/hooks/usePromptWizard";
import ParameterCustomization from "./wizard/ParameterCustomization";
import AdditionalContextStep from "./wizard/AdditionalContextStep";
import ReviewStep from "./wizard/ReviewStep";
import WizardNavigation from "./wizard/WizardNavigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      toast({
        title: "You're back online",
        description: "Reconnected to the server. You can retry loading the prompt.",
      });
    };
    
    const handleOffline = () => {
      setNetworkStatus('offline');
      toast({
        title: "You're offline",
        description: "Please check your internet connection.",
        variant: "destructive"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  const {
    prompt,
    parameters,
    isLoading,
    error,
    generating,
    selectedTweaks,
    additionalContext,
    currentStepIndex,
    steps,
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
    
    // Call the new refetch function
    refetchPrompt();
  };
  
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
        
        <Progress value={progressValue} className="h-1" />
        
        {networkStatus === 'offline' && (
          <Alert variant="destructive" className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>You're offline</AlertTitle>
            <AlertDescription>
              Please check your internet connection and try again when you're back online.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading prompt...</span>
          </div>
        ) : error ? (
          <div className="py-6">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error loading prompt</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Could not load the prompt data. You can try again or select a different prompt.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button 
                  onClick={handleRetry} 
                  className="gap-2"
                  disabled={networkStatus === 'offline'}
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        ) : !prompt ? (
          <div className="flex flex-col justify-center items-center py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mb-4" />
            <p className="text-muted-foreground">
              Unable to load prompt. Please try again or select a different prompt.
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={handleRetry} 
                className="gap-2"
                disabled={networkStatus === 'offline'}
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-[350px] py-4">
            {parameters.length === 0 ? (
              <div className="py-6">
                <Alert className="mb-4">
                  <HelpCircle className="h-4 w-4" />
                  <AlertDescription>
                    This prompt doesn't have any customization options. You can skip to the additional context.
                  </AlertDescription>
                </Alert>
                <AdditionalContextStep 
                  additionalContext={additionalContext} 
                  setAdditionalContext={setAdditionalContext}
                />
              </div>
            ) : (
              renderStepContent()
            )}
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
