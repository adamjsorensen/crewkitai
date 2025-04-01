
import React, { useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ParameterCustomizationProps {
  parameter: ParameterWithTweaks;
  selectedTweakId: string | undefined;
  onTweakChange: (parameterId: string, tweakId: string) => void;
}

// Create a memoized TweakOption component to prevent re-renders
const TweakOption = React.memo(({ 
  tweak, 
  parameterId, 
  isSelected 
}: { 
  tweak: any; 
  parameterId: string; 
  isSelected: boolean;
}) => (
  <div key={tweak.id} className="flex items-start space-x-2 p-3 border rounded-md">
    <RadioGroupItem id={tweak.id} value={tweak.id} />
    <div className="flex-1">
      <Label htmlFor={tweak.id} className="font-medium cursor-pointer">
        {tweak.name}
      </Label>
    </div>
  </div>
));

TweakOption.displayName = 'TweakOption';

const ParameterCustomization = React.memo(({ 
  parameter, 
  selectedTweakId, 
  onTweakChange 
}: ParameterCustomizationProps) => {
  // Only log when the parameter or selection changes
  useEffect(() => {
    console.log("Rendering parameter:", parameter.name, {
      parameterId: parameter.id,
      tweaksCount: parameter.tweaks?.length || 0,
      selectedTweakId,
      isRequired: parameter.rule?.is_required
    });
  }, [parameter.id, parameter.name, parameter.tweaks?.length, selectedTweakId, parameter.rule?.is_required]);
  
  if (!parameter || !parameter.id) {
    console.error("Invalid parameter data received:", parameter);
    return (
      <Alert className="mb-4 border-red-500">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription>
          Error loading parameter data. Please try refreshing the wizard.
        </AlertDescription>
      </Alert>
    );
  }

  // Memoize the tweaks to prevent re-renders
  const tweaks = React.useMemo(() => 
    parameter.tweaks && parameter.tweaks.length > 0 ? parameter.tweaks : [],
    [parameter.tweaks]
  );

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
          {tweaks.length > 0 ? (
            tweaks.map((tweak) => (
              <TweakOption 
                key={tweak.id}
                tweak={tweak} 
                parameterId={parameter.id} 
                isSelected={selectedTweakId === tweak.id}
              />
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
});

ParameterCustomization.displayName = 'ParameterCustomization';

export default ParameterCustomization;
