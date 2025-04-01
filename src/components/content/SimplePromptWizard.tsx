
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
  
  // Log the parameters received in the component
  useEffect(() => {
    console.log(`[SimplePromptWizard] Parameters received: count=${parameters?.length || 0}`);
    if (parameters?.length > 0) {
      console.log("[SimplePromptWizard] First few parameters:", 
        parameters.slice(0, 3).map(p => ({id: p.id, name: p.name, tweaks: p.tweaks?.length || 0}))
      );
    }
  }, [parameters]);
  
  // Determine the error type for the error state component
  const getErrorType = () => {
    if (!error) return 'unknown';
    if (error.includes("not found") || error.includes("doesn't exist")) {
      return 'not-found';
    } else if (error.includes("connection") || error.includes("network") || error.includes("Failed to fetch") || error.includes("timeout")) {
      return 'connection';
    }
    return 'unknown';
  };
  
  // Log connection issues with better debug information
  useEffect(() => {
    if (networkStatus === 'offline') {
      console.log("[SimplePromptWizard] Network is offline - this will affect data loading");
    }
    
    // Log prompt ID and loading state
    console.log(`[SimplePromptWizard] Prompt ID: ${promptId}, isLoading: ${isLoading}, error: ${error ? 'yes' : 'no'}`);
    
  }, [networkStatus, promptId, isLoading, error]);
  
  if (!isOpen) return null;
  
  const dialogTitle = isLoading 
    ? "Loading..." 
    : prompt 
      ? `Customize Prompt: ${prompt.title}` 
      : "Customize Prompt";
  
  const hasParameters = parameters && Array.isArray(parameters) && parameters.length > 0;
  
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
            errorType={getErrorType()}
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
                    <p>Parameters count: {parameters?.length || 0}</p>
                    <p>Has parameters: {hasParameters ? 'Yes' : 'No'}</p>
                    <p>Parameters: {JSON.stringify(parameters?.map(p => p.name))}</p>
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
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="customize" className="flex-1">
                  Customize {hasParameters && <span className="ml-1 text-xs">({parameters.length})</span>}
                </TabsTrigger>
                <TabsTrigger value="context" className="flex-1">Add Context</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customize" className="py-4">
                {hasParameters ? (
                  <AllParametersView 
                    parameters={parameters} 
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
