
import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface AdditionalContextStepProps {
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
}

const AdditionalContextStep = React.memo(({ 
  additionalContext, 
  setAdditionalContext 
}: AdditionalContextStepProps) => {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalContext(e.target.value);
  }, [setAdditionalContext]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Additional Context</h3>
      <p className="text-sm text-muted-foreground">
        Provide any specific details or information you want included in the generated content.
      </p>
      <Textarea
        placeholder="Enter additional context here..."
        className="min-h-[150px]"
        value={additionalContext}
        onChange={handleChange}
      />
    </div>
  );
});

AdditionalContextStep.displayName = "AdditionalContextStep";

export default AdditionalContextStep;
