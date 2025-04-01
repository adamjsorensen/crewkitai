
import React, { useMemo } from "react";
import { ParameterWithTweaks } from "@/types/promptParameters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface AllParametersViewProps {
  parameters: ParameterWithTweaks[];
  selectedTweaks: Record<string, string>;
  onTweakChange: (parameterId: string, tweakId: string) => void;
  onForceRefresh?: () => void;
}

// Logging levels control
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set this to control logging verbosity
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN;

// Custom logger to control logging
const logger = {
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[AllParametersView] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[AllParametersView] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[AllParametersView] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[AllParametersView] ${message}`, ...args);
  }
};

// Memoize the parameter option to prevent re-renders
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

  // Verify the tweak has a valid name
  const tweakName = tweak.name || 'Unnamed Tweak';

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
          {tweakName}
        </Label>
      </div>
    </div>
  );
});

ParameterOption.displayName = "ParameterOption";

// Memoize the entire parameter card
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
  // Debug logging for parameter rendering conditionally
  if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
    logger.debug(`Rendering parameter ${param.name} with ${param.tweaks?.length || 0} tweaks`);
  }
  
  // Improved validation for tweaks array - memoized
  const hasTweaks = useMemo(() => {
    return param.tweaks && 
           Array.isArray(param.tweaks) && 
           param.tweaks.length > 0 && 
           param.tweaks.some(tweak => tweak && tweak.id);
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
                // Skip invalid tweaks
                if (!tweak || !tweak.id) {
                  if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) {
                    logger.warn(`Skipping invalid tweak for parameter ${param.name}`);
                  }
                  return null;
                }
                
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

// Main component that renders parameters, highly optimized
const AllParametersView = React.memo(({
  parameters,
  selectedTweaks,
  onTweakChange,
  onForceRefresh
}: AllParametersViewProps) => {
  // Log rendering only in development and not too frequently
  if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) {
    logger.info(`Rendering with ${parameters?.length || 0} parameters`);
  }
  
  // Validate and create a safe copy of parameters with a memo
  const safeParameters = useMemo(() => {
    if (!Array.isArray(parameters)) {
      logger.warn("Received non-array parameters:", parameters);
      return [];
    }
    
    // Filter out invalid parameters
    const filteredParams = parameters.filter(p => p && p.id && p.name);
    
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Filtered ${parameters.length} parameters to ${filteredParams.length} valid ones`);
    }
    
    return filteredParams;
  }, [parameters]);

  // Debug button for development only
  const debugSection = useMemo(() => {
    if (process.env.NODE_ENV !== 'production' && onForceRefresh) {
      return (
        <div className="mb-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700">Debug Information</AlertTitle>
            <AlertDescription className="text-blue-600">
              <div className="flex flex-col space-y-1">
                <span>Parameters loaded: {safeParameters.length}</span>
                <span>Selected tweaks: {Object.keys(selectedTweaks).length}</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onForceRefresh}
                  className="w-fit mt-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Force Refresh Parameters
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    return null;
  }, [safeParameters.length, selectedTweaks, onForceRefresh]);
  
  // Handle empty parameters array
  if (safeParameters.length === 0) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) {
      logger.info("No valid parameters to render");
    }
    
    return (
      <div className="space-y-4">
        {debugSection}
        <Alert>
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            This prompt doesn't have any customization parameters.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {debugSection}
      
      <h3 className="text-lg font-medium">Customize Your Prompt</h3>
      
      <div className="space-y-6">
        {safeParameters.map((param, index) => (
          <ParameterCard
            key={param.id}
            param={param}
            selectedTweakId={selectedTweaks[param.id]}
            onTweakChange={onTweakChange}
            isLast={index === safeParameters.length - 1}
          />
        ))}
      </div>
    </div>
  );
});

AllParametersView.displayName = "AllParametersView";

export default AllParametersView;
