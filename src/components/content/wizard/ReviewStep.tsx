
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Prompt } from "@/hooks/useCrewkitPrompts";

interface ReviewStepProps {
  prompt: Prompt | null;
  selectedTweaks: Record<string, string>;
  parameters: any[];
  additionalContext: string;
}

const ReviewStep = ({ 
  prompt, 
  selectedTweaks, 
  parameters, 
  additionalContext 
}: ReviewStepProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Your Selections</h3>
      <div className="rounded-md border p-4 space-y-3">
        <div>
          <h4 className="font-medium">Base Prompt</h4>
          <p className="text-sm text-muted-foreground">{prompt?.title}</p>
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
  );
};

export default ReviewStep;
