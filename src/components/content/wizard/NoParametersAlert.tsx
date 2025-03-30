
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle } from "lucide-react";
import AdditionalContextStep from "./AdditionalContextStep";

interface NoParametersAlertProps {
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
}

const NoParametersAlert: React.FC<NoParametersAlertProps> = ({
  additionalContext,
  setAdditionalContext
}) => {
  return (
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
  );
};

export default NoParametersAlert;
