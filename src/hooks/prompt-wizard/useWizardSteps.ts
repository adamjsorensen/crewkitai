
import { useMemo } from "react";
import { Prompt } from "@/hooks/useCrewkitPrompts";

export function useWizardSteps(prompt: Prompt | null, parameters: any[], selectedTweaks: Record<string, string>) {
  const steps = useMemo(() => {
    if (!prompt) return [];
    
    return [
      ...(parameters.length > 0 ? parameters.map(param => ({
        title: `Customize: ${param.name}`,
        isCompleted: () => !param.rule?.is_required || !!selectedTweaks[param.id],
      })) : []),
      {
        title: "Additional Context",
        isCompleted: () => true,
      },
      {
        title: "Review",
        isCompleted: () => true,
      }
    ];
  }, [prompt, parameters, selectedTweaks]);

  const currentStep = (index: number) => steps[index];
  const progress = (index: number) => steps.length ? ((index + 1) / steps.length) * 100 : 0;
  const canProceed = (index: number) => currentStep(index)?.isCompleted?.() ?? true;
  const isLastStep = (index: number) => index === steps.length - 1;

  return {
    steps,
    currentStep,
    progress,
    canProceed,
    isLastStep
  };
}
