
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
  // Enhanced validation and debug logging for parameters 
  useEffect(() => {
    console.log("[AllParametersView] Rendering with parameters:", {
      count: parameters?.length || 0,
      selectedTweaksCount: Object.keys(selectedTweaks || {}).length
    });
    
    // Verify parameter data integrity
    if (parameters && parameters.length > 0) {
      const validParams = parameters.every(p => p && p.id && p.name);
      if (!validParams) {
        console.error("[AllParametersView] INVALID PARAMETER DATA:", 
          parameters.filter(p => !p || !p.id || !p.name)
        );
      } else {
        console.log("[AllParametersView] Parameters data validation passed");
        
        // Check tweaks for each parameter
        parameters.forEach(param => {
          if (!param.tweaks || param.tweaks.length === 0) {
            console.warn(`[AllParametersView] Parameter '${param.name}' has no tweaks`);
          } else {
            console.log(`[AllParametersView] Parameter '${param.name}' has ${param.tweaks.length} tweaks`);
          }
          
          // Check selected tweak
          if (selectedTweaks[param.id]) {
            const tweakExists = param.tweaks?.some(t => t.id === selectedTweaks[param.id]);
            if (!tweakExists) {
              console.error(`[AllParametersView] Selected tweak ${selectedTweaks[param.id]} not found in parameter ${param.name}`);
            }
          }
        });
      }
    }
  }, [parameters, selectedTweaks]);

  // Force cast to array to prevent runtime errors
  const safeParameters = Array.isArray(parameters) ? parameters : [];
  
  // Basic validation - Check for invalid parameters array
  if (!safeParameters) {
    console.error("[AllParametersView] Parameters is null or undefined");
    return (
      <Alert className="mb-4 border-amber-500">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription>
          Error loading parameters data. The data is missing.
        </AlertDescription>
      </Alert>
    );
  }

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

  // Debug display of valid parameters before rendering
  console.log("[AllParametersView] Rendering parameters:", 
    safeParameters.map(p => ({id: p.id, name: p.name, tweaksCount: p.tweaks?.length || 0}))
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Customize Your Prompt</h3>
      
      {safeParameters.map((param, index) => {
        // Skip invalid parameters
        if (!param || !param.id) {
          console.error("[AllParametersView] Invalid parameter at index", index);
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
              
              {hasTweaks ? (
                <RadioGroup 
                  value={selectedTweaks[param.id] || ''} 
                  onValueChange={(value) => {
                    console.log(`[AllParametersView] Tweak selected for parameter ${param.id}: ${value}`);
                    onTweakChange(param.id, value);
                  }}
                >
                  <div className="space-y-2">
                    {param.tweaks.map((tweak) => {
                      // Skip invalid tweaks
                      if (!tweak || !tweak.id) {
                        console.error("[AllParametersView] Invalid tweak for parameter", param.name);
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
              
              {param.rule?.is_required && !selectedTweaks[param.id] && (
                <p className="text-sm text-red-500 mt-2">
                  This selection is required.
                </p>
              )}
            </CardContent>
            
            {index < safeParameters.length - 1 && <Separator />}
          </Card>
        );
      })}
    </div>
  );
};

export default AllParametersView;
