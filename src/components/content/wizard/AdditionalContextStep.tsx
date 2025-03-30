
import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface AdditionalContextStepProps {
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
}

const AdditionalContextStep = ({ 
  additionalContext, 
  setAdditionalContext 
}: AdditionalContextStepProps) => {
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
        onChange={(e) => setAdditionalContext(e.target.value)}
      />
    </div>
  );
};

export default AdditionalContextStep;
