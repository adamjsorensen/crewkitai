
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useSimplifiedPromptWizard } from "@/hooks/useSimplifiedPromptWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllParametersView from "./wizard/AllParametersView";
import AdditionalContextStep from "./wizard/AdditionalContextStep";
import LoadingState from "./wizard/LoadingState";
import ErrorAndRetryState from "./wizard/ErrorAndRetryState";
import NetworkStatusAlert from "./wizard/NetworkStatusAlert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface SimplePromptWizardProps {
  promptId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SimplePromptWizard: React.FC<SimplePromptWizardProps> = ({ 
  promptId, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState("customize");
  const [isClosing, setIsClosing] = useState(false);
  
  // Wrap the onClose function to add a transition delay
  const handleClose = () => {
    setIsClosing(true);
    // Short delay before actually closing the dialog
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 100);
  };
  
  // Log promptId to debug
  useEffect(() => {
    if (isOpen) {
      console.log(`[SimplePromptWizard] Opening with promptId: ${promptId || 'undefined'}`);
    }
  }, [isOpen, promptId]);
  
  // Use the enhanced wizard hook with direct parameter loading
  const {
    prompt,
    parameters,
    isLoading,
    error,
    generating,
    selectedTweaks,
    additionalContext,
    networkStatus,
    handleTweakChange,
    setAdditionalContext,
    handleSave,
    isFormValid,
    handleRetry
  } = useSimplifiedPromptWizard(promptId, isOpen, onClose);
  
  // Debug log - Added explicitly to track what parameters we're getting
  useEffect(() => {
    console.log(`[SimplePromptWizard] Parameters received: count=${parameters?.length || 0}`);
    if (parameters?.length > 0) {
      console.log("[SimplePromptWizard] First few parameters:", 
        parameters.slice(0, 3).map(p => ({id: p.id, name: p.name, tweaks: p.tweaks?.length || 0}))
      );
      
      // Verify parameter structure integrity
      const hasValidParameters = parameters.every(p => p && p.id && p.name);
      console.log(`[SimplePromptWizard] Parameters valid: ${hasValidParameters}`);
      
      // Check if parameters have tweaks
      const parametersWithTweaks = parameters.filter(p => p.tweaks && p.tweaks.length > 0);
      console.log(`[SimplePromptWizard] Parameters with tweaks: ${parametersWithTweaks.length}`);
    }
  }, [parameters]);
  
  // Track loading state changes
  useEffect(() => {
    console.log(`[SimplePromptWizard] Prompt ID: ${promptId}, isLoading: ${isLoading}, error: ${error ? 'yes' : 'no'}`);
  }, [promptId, isLoading, error]);
  
  // Circuit breaker for infinite loading
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.log('[SimplePromptWizard] Loading timeout triggered, forcing refresh');
        if (handleRetry) handleRetry();
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, handleRetry]);
  
  if (!isOpen) return null;
  
  const dialogTitle = isLoading 
    ? "Loading..." 
    : prompt 
      ? `Customize Prompt: ${prompt.title}` 
      : "Customize Prompt";
  
  // Force cast parameters to an array to prevent rendering issues
  const safeParameters = Array.isArray(parameters) ? parameters : [];
  const hasParameters = safeParameters.length > 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {networkStatus === 'offline' && <WifiOff className="h-5 w-5 text-red-500" />}
            {networkStatus === 'online' && !error && <Wifi className="h-5 w-5 text-green-500" />}
            {error && <AlertCircle className="h-5 w-5 text-red-500" />}
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            Customize this prompt to generate content tailored to your needs
          </DialogDescription>
        </DialogHeader>
        
        <NetworkStatusAlert networkStatus={networkStatus} />
        
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorAndRetryState 
            error={error} 
            onClose={handleClose} 
            onRetry={handleRetry} 
            networkStatus={networkStatus}
            errorType={error.includes("not found") ? "not-found" : 
                       error.includes("connection") ? "connection" : "unknown"}
          />
        ) : !prompt ? (
          <ErrorAndRetryState 
            error="Unable to load prompt details."
            onClose={handleClose} 
            onRetry={handleRetry} 
            networkStatus={networkStatus}
            errorType="not-found"
          />
        ) : (
          <div className="min-h-[350px]">
            {/* Debug information */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mb-4 p-2 bg-gray-100 text-xs rounded-md">
                <details>
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <div className="mt-2 space-y-1">
                    <p>Prompt ID: {prompt.id}</p>
                    <p>Parameters count: {safeParameters.length}</p>
                    <p>Has parameters: {hasParameters ? 'Yes' : 'No'}</p>
                    <p>Parameters: {JSON.stringify(safeParameters.map(p => p.name))}</p>
                    <p>Selected tweaks: {Object.keys(selectedTweaks).length}</p>
                    <p>Network: {networkStatus}</p>
                  </div>
                </details>
              </div>
            )}
            
            {!hasParameters && (
              <Alert className="mb-4" variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>No Customization Options</AlertTitle>
                <AlertDescription>
                  This prompt doesn't have any customization parameters. You can add context in the next tab.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="customize">
              <TabsList className="w-full">
                <TabsTrigger value="customize" className="flex-1">
                  Customize {hasParameters && <span className="ml-1 text-xs">({safeParameters.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="context" className="flex-1">Add Context</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customize" className="py-4">
                {hasParameters ? (
                  <AllParametersView 
                    parameters={safeParameters} 
                    selectedTweaks={selectedTweaks}
                    onTweakChange={handleTweakChange}
                  />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No customization options available for this prompt.</p>
                    <p className="mt-2">You can add additional context in the next tab.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="context" className="py-4">
                <AdditionalContextStep 
                  additionalContext={additionalContext} 
                  setAdditionalContext={setAdditionalContext}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          {error && !isLoading && (
            <Button 
              variant="outline" 
              onClick={handleRetry} 
              className="mr-auto"
              disabled={networkStatus === 'offline'}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid() || generating || isLoading || error !== null || networkStatus === 'offline'}
            className="gap-1"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Generate Content
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePromptWizard;
