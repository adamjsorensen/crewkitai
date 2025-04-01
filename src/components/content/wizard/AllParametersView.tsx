
import React, { useMemo } from "react";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface AllParametersViewProps {
  parameters: ParameterWithTweaks[];
  selectedTweaks: Record<string, string>;
  onTweakChange: (parameterId: string, tweakId: string) => void;
}

const ParameterOption = React.memo(({ 
  parameterId, 
  tweak, 
  isSelected, 
  onSelect 
}: { 
  parameterId: string; 
  tweak: any; 
  isSelected: boolean; 
  onSelect: (value: string) => void;
}) => {
  const handleChange = React.useCallback(() => {
    onSelect(tweak.id);
  }, [onSelect, tweak.id]);

  return (
    <div className="flex items-start space-x-2 p-3 border rounded-md hover:bg-muted/30 transition-colors">
      <RadioGroupItem 
        id={`${parameterId}-${tweak.id}`} 
        value={tweak.id} 
        checked={isSelected}
        onClick={handleChange}
      />
      <div className="flex-1">
        <Label 
          htmlFor={`${parameterId}-${tweak.id}`} 
          className="font-medium cursor-pointer"
        >
          {tweak.name || 'Unnamed Tweak'}
        </Label>
      </div>
    </div>
  );
});

ParameterOption.displayName = "ParameterOption";

const ParameterCard = React.memo(({ 
  param, 
  selectedTweakId, 
  onTweakChange,
  isLast
}: { 
  param: ParameterWithTweaks; 
  selectedTweakId: string | undefined; 
  onTweakChange: (parameterId: string, tweakId: string) => void;
  isLast: boolean;
}) => {
  const hasTweaks = useMemo(() => {
    return param.tweaks && Array.isArray(param.tweaks) && param.tweaks.length > 0;
  }, [param.tweaks]);

  const handleValueChange = React.useCallback((value: string) => {
    onTweakChange(param.id, value);
  }, [param.id, onTweakChange]);

  return (
    <Card key={param.id} className="overflow-hidden">
      <CardHeader className="bg-muted/50 py-3">
        <CardTitle className="text-base">{param.name || 'Unnamed Parameter'}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {param.description && (
          <p className="text-sm text-muted-foreground mb-3">{param.description}</p>
        )}
        
        {hasTweaks ? (
          <RadioGroup 
            value={selectedTweakId || ''} 
            onValueChange={handleValueChange}
          >
            <div className="space-y-2">
              {param.tweaks.map((tweak) => {
                if (!tweak || !tweak.id) return null;
                return (
                  <ParameterOption
                    key={tweak.id}
                    parameterId={param.id}
                    tweak={tweak}
                    isSelected={selectedTweakId === tweak.id}
                    onSelect={handleValueChange}
                  />
                );
              })}
            </div>
          </RadioGroup>
        ) : (
          <Alert className="bg-muted/30 border-muted">
            <Info className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-sm text-muted-foreground">
              No options available for this parameter.
            </AlertDescription>
          </Alert>
        )}
        
        {param.rule?.is_required && !selectedTweakId && (
          <p className="text-sm text-red-500 mt-2">
            This selection is required.
          </p>
        )}
      </CardContent>
      
      {!isLast && <Separator />}
    </Card>
  );
});

ParameterCard.displayName = "ParameterCard";

const AllParametersView = React.memo(({
  parameters,
  selectedTweaks,
  onTweakChange
}: AllParametersViewProps) => {
  // Force cast to array to prevent runtime errors
  const safeParameters = useMemo(() => {
    return Array.isArray(parameters) ? parameters : [];
  }, [parameters]);
  
  // Handle empty parameters array
  if (safeParameters.length === 0) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          This prompt doesn't have any customization parameters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Customize Your Prompt</h3>
      
      {safeParameters.map((param, index) => {
        // Skip invalid parameters
        if (!param || !param.id) {
          console.error("[AllParametersView] Invalid parameter at index", index);
          return null;
        }
        
        return (
          <ParameterCard
            key={param.id}
            param={param}
            selectedTweakId={selectedTweaks[param.id]}
            onTweakChange={onTweakChange}
            isLast={index === safeParameters.length - 1}
          />
        );
      })}
    </div>
  );
});

AllParametersView.displayName = "AllParametersView";

export default AllParametersView;
