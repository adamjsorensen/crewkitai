
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
  // VALIDATION: Enhanced validation and debug logging
  useEffect(() => {
    if (!parameters) {
      console.warn("[AllParametersView] Parameters is undefined");
      return;
    }
    
    if (!Array.isArray(parameters)) {
      console.error("[AllParametersView] Parameters is not an array:", parameters);
      return;
    }
    
    if (parameters.length === 0) {
      console.log("[AllParametersView] No parameters provided or empty array");
      return;
    }
    
    // Validate parameter data
    parameters.forEach(param => {
      if (!param) {
        console.error("[AllParametersView] Null or undefined parameter in array");
        return;
      }
      
      if (!param.id) {
        console.error("[AllParametersView] Parameter missing ID:", param);
      }
      
      if (!param.name) {
        console.error("[AllParametersView] Parameter missing name:", param);
      }
      
      console.log(`[AllParametersView] Parameter ${param.name || 'unnamed'} (${param.id}) has ${param.tweaks?.length || 0} tweaks`);
      
      if (!param.tweaks || param.tweaks.length === 0) {
        console.warn(`[AllParametersView] Parameter ${param.name || 'unnamed'} has no tweaks`);
      } else {
        // Check tweaks validity
        param.tweaks.forEach(tweak => {
          if (!tweak.id) {
            console.error(`[AllParametersView] Tweak missing ID for parameter ${param.name}:`, tweak);
          }
        });
      }
    });
    
    // Log selected tweaks for debugging
    console.log("[AllParametersView] Current selected tweaks:", selectedTweaks);
  }, [parameters, selectedTweaks]);

  // VALIDATION: Check for invalid parameters array
  if (!parameters || !Array.isArray(parameters)) {
    console.error("[AllParametersView] Invalid parameters value:", parameters);
    return (
      <Alert className="mb-4 border-amber-500">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription>
          Error loading parameters data. The data format is invalid.
        </AlertDescription>
      </Alert>
    );
  }

  // VALIDATION: Handle empty parameters array
  if (parameters.length === 0) {
    return (
      <Alert className="mb-4">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          This prompt doesn't have any customization parameters.
        </AlertDescription>
      </Alert>
    );
  }

  // Debug display of valid parameters before rendering
  console.log("[AllParametersView] Rendering parameters:", 
    parameters.map(p => ({id: p.id, name: p.name, tweaksCount: p.tweaks?.length || 0}))
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Customize Your Prompt</h3>
      
      {parameters.map((param, index) => {
        // VALIDATION: Skip invalid parameters
        if (!param || !param.id) {
          console.error("[AllParametersView] Invalid parameter at index", index, param);
          return null;
        }
        
        // Check if parameter has tweaks
        const hasTweaks = param.tweaks && Array.isArray(param.tweaks) && param.tweaks.length > 0;
        
        return (
          <Card key={param.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50 py-3">
              <CardTitle className="text-base">{param.name || 'Unnamed Parameter'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {param.description && (
                <p className="text-sm text-muted-foreground mb-3">{param.description}</p>
              )}
              
              <RadioGroup 
                value={selectedTweaks[param.id] || ''} 
                onValueChange={(value) => {
                  console.log(`[AllParametersView] Tweak selected for parameter ${param.id}: ${value}`);
                  onTweakChange(param.id, value);
                }}
              >
                <div className="space-y-2">
                  {hasTweaks ? (
                    param.tweaks.map((tweak) => {
                      // VALIDATION: Skip invalid tweaks
                      if (!tweak || !tweak.id) {
                        console.error("[AllParametersView] Invalid tweak for parameter", param.name, tweak);
                        return null;
                      }
                      
                      return (
                        <div key={tweak.id} className="flex items-start space-x-2 p-3 border rounded-md hover:bg-muted/30 transition-colors">
                          <RadioGroupItem id={`${param.id}-${tweak.id}`} value={tweak.id} />
                          <div className="flex-1">
                            <Label htmlFor={`${param.id}-${tweak.id}`} className="font-medium cursor-pointer">
                              {tweak.name || 'Unnamed Tweak'}
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
