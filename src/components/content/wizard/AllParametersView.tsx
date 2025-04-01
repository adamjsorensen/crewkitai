
import React, { useEffect } from "react";
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

const AllParametersView: React.FC<AllParametersViewProps> = ({
  parameters,
  selectedTweaks,
  onTweakChange
}) => {
  // Debug logging to track parameter rendering
  useEffect(() => {
    console.log("AllParametersView received parameters:", parameters);
    console.log("AllParametersView received selectedTweaks:", selectedTweaks);
    
    if (!parameters || parameters.length === 0) {
      console.warn("AllParametersView: No parameters provided or empty array");
    } else {
      // Validate parameter data
      parameters.forEach(param => {
        if (!param.id) {
          console.error("Parameter missing ID:", param);
        }
        
        console.log(`Parameter ${param.name || 'unnamed'} (${param.id}) has ${param.tweaks?.length || 0} tweaks`);
        
        if (!param.tweaks || param.tweaks.length === 0) {
          console.warn(`Parameter ${param.name || 'unnamed'} has no tweaks`);
        }
      });
    }
  }, [parameters, selectedTweaks]);

  if (!parameters || parameters.length === 0) {
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
      
      {parameters.map((param, index) => {
        // Skip invalid parameters
        if (!param || !param.id) {
          console.error("Invalid parameter at index", index, param);
          return null;
        }
        
        return (
          <Card key={param.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="text-base">{param.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {param.description && (
                <p className="text-sm text-muted-foreground mb-3">{param.description}</p>
              )}
              
              <RadioGroup 
                value={selectedTweaks[param.id] || ''} 
                onValueChange={(value) => {
                  console.log(`Tweak selected for parameter ${param.id}: ${value}`);
                  onTweakChange(param.id, value);
                }}
              >
                <div className="space-y-2">
                  {param.tweaks && param.tweaks.length > 0 ? (
                    param.tweaks.map((tweak) => {
                      if (!tweak || !tweak.id) {
                        console.error("Invalid tweak for parameter", param.name, tweak);
                        return null;
                      }
                      
                      return (
                        <div key={tweak.id} className="flex items-start space-x-2 p-3 border rounded-md">
                          <RadioGroupItem id={`${param.id}-${tweak.id}`} value={tweak.id} />
                          <div className="flex-1">
                            <Label htmlFor={`${param.id}-${tweak.id}`} className="font-medium cursor-pointer">
                              {tweak.name}
                            </Label>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No options available for this parameter.
                    </p>
                  )}
                </div>
              </RadioGroup>
              
              {param.rule?.is_required && !selectedTweaks[param.id] && (
                <p className="text-sm text-red-500 mt-2">
                  This selection is required.
                </p>
              )}
            </CardContent>
            
            {index < parameters.length - 1 && <Separator />}
          </Card>
        );
      })}
    </div>
  );
}

export default AllParametersView;
