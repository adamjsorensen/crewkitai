
import React from "react";
import { Info } from "lucide-react";
import AdditionalContextStep from "./AdditionalContextStep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NoParametersAlertProps {
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
}

const NoParametersAlert: React.FC<NoParametersAlertProps> = ({
  additionalContext,
  setAdditionalContext
}) => {
  return (
    <div className="py-4">
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-blue-700">
            <Info className="h-5 w-5" />
            Direct to Additional Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 text-sm">
            This prompt doesn't have any customization options, so you can proceed directly to adding your own context.
          </p>
        </CardContent>
      </Card>
      <AdditionalContextStep 
        additionalContext={additionalContext} 
        setAdditionalContext={setAdditionalContext}
      />
    </div>
  );
};

export default NoParametersAlert;
