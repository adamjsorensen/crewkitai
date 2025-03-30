
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface WizardNavigationProps {
  currentStepIndex: number;
  isLastStep: boolean;
  canProceed: boolean;
  generating: boolean;
  isLoading: boolean;
  promptLoaded: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
}

const WizardNavigation = ({
  currentStepIndex,
  isLastStep,
  canProceed,
  generating,
  isLoading,
  promptLoaded,
  onPrevious,
  onNext,
  onSave
}: WizardNavigationProps) => {
  return (
    <div className="flex justify-between sm:justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStepIndex === 0 || generating || isLoading || !promptLoaded}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div>
        {isLastStep ? (
          <Button 
            onClick={onSave} 
            disabled={!canProceed || generating || isLoading || !promptLoaded}
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
            onClick={onNext} 
            disabled={!canProceed || generating || isLoading || !promptLoaded}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardNavigation;
