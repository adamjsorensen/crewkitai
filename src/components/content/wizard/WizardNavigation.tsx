
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

interface WizardNavigationProps {
  currentStepIndex: number;
  isLastStep: boolean;
  canProceed: boolean;
  generating: boolean;
  isLoading: boolean;
  promptLoaded: boolean;
  networkStatus?: 'online' | 'offline';
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStepIndex,
  isLastStep,
  canProceed,
  generating,
  isLoading,
  promptLoaded,
  networkStatus = 'online',
  onPrevious,
  onNext,
  onSave
}) => {
  const isNetworkDisabled = networkStatus === 'offline';
  
  return (
    <div className="flex justify-between w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStepIndex === 0 || isLoading || generating || !promptLoaded}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Previous
      </Button>
      
      <div>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSave}
            disabled={!canProceed || generating || !promptLoaded || isNetworkDisabled}
            className="gap-1"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed || isLoading || !promptLoaded || isNetworkDisabled}
            className="gap-1"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardNavigation;
