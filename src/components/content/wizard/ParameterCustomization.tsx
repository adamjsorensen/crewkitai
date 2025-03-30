
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ParameterCustomizationProps {
  parameter: any;
  selectedTweakId: string | undefined;
  onTweakChange: (parameterId: string, tweakId: string) => void;
}

const ParameterCustomization = ({ 
  parameter, 
  selectedTweakId, 
  onTweakChange 
}: ParameterCustomizationProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{parameter.name}</h3>
      {parameter.description && (
        <p className="text-sm text-muted-foreground">{parameter.description}</p>
      )}
      
      <RadioGroup 
        value={selectedTweakId || ''} 
        onValueChange={(value) => onTweakChange(parameter.id, value)}
      >
        <div className="space-y-2">
          {parameter.tweaks && parameter.tweaks.length > 0 ? (
            parameter.tweaks.map((tweak: any) => (
              <div key={tweak.id} className="flex items-start space-x-2 p-3 border rounded-md">
                <RadioGroupItem id={tweak.id} value={tweak.id} />
                <div className="flex-1">
                  <Label htmlFor={tweak.id} className="font-medium cursor-pointer">
                    {tweak.name}
                  </Label>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No options available for this parameter.
            </p>
          )}
        </div>
      </RadioGroup>
      
      {parameter.rule?.is_required && !selectedTweakId && (
        <p className="text-sm text-red-500">
          This selection is required.
        </p>
      )}
    </div>
  );
};

export default ParameterCustomization;
