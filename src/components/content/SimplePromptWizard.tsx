
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, RefreshCw, Wifi, WifiOff, AlertCircle, Info } from "lucide-react";
import { useSimplifiedPromptWizard } from "@/hooks/useSimplifiedPromptWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllParametersView from "./wizard/AllParametersView";
import AdditionalContextStep from "./wizard/AdditionalContextStep";
import LoadingState from "./wizard/LoadingState";
import ErrorAndRetryState from "./wizard/ErrorAndRetryState";
import NetworkStatusAlert from "./wizard/NetworkStatusAlert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { debounce } from "@/lib/utils";

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
  const [stableLoading, setStableLoading] = useState(false);
  
  const renderCount = useRef(0);
  
  // Create a stable debounced setter for loading state to prevent rapid changes
  const setStableLoadingDebounced = useMemo(
    () => debounce((value: boolean) => {
      console.log(`[SimplePromptWizard] Setting stable loading state to: ${value}`);
      setStableLoading(value);
    }, 300),
    []
  );
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 100);
  };
  
  useEffect(() => {
    if (isOpen) {
      console.log(`[SimplePromptWizard] Opening with promptId: ${promptId || 'undefined'}`);
    }
    
    // Clean up debounced function on unmount
    return () => {
      setStableLoadingDebounced.cancel();
    };
  }, [isOpen, promptId, setStableLoadingDebounced]);
  
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
  
  // Update stable loading state with debounce to prevent flickering
  useEffect(() => {
    setStableLoadingDebounced(isLoading);
    
    return () => {
      setStableLoadingDebounced.cancel();
    };
  }, [isLoading, setStableLoadingDebounced]);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`[SimplePromptWizard] Render #${renderCount.current}, isLoading: ${isLoading}, stableLoading: ${stableLoading}`);
  });
  
  useEffect(() => {
    console.log(`[SimplePromptWizard] Parameters received: count=${parameters?.length || 0}`);
    if (parameters?.length > 0) {
      console.log("[SimplePromptWizard] First few parameters:", 
        parameters.slice(0, 3).map(p => ({id: p.id, name: p.name, tweaks: p.tweaks?.length || 0}))
      );
      
      const hasValidParameters = parameters.every(p => p && p.id && p.name);
      console.log(`[SimplePromptWizard] Parameters valid: ${hasValidParameters}`);
      
      const parametersWithTweaks = parameters.filter(p => p.tweaks && p.tweaks.length > 0);
      console.log(`[SimplePromptWizard] Parameters with tweaks: ${parametersWithTweaks.length}`);
    }
  }, [parameters]);
  
  useEffect(() => {
    console.log(`[SimplePromptWizard] Prompt ID: ${promptId}, isLoading: ${isLoading}, error: ${error ? 'yes' : 'no'}`);
  }, [promptId, isLoading, error]);
  
  useEffect(() => {
    if (stableLoading) {
      const timeoutId = setTimeout(() => {
        console.log('[SimplePromptWizard] Loading timeout triggered, forcing refresh');
        if (handleRetry) handleRetry();
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [stableLoading, handleRetry]);
  
  if (!isOpen) return null;
  
  const dialogTitle = stableLoading 
    ? "Loading..." 
    : prompt 
      ? `Customize Prompt: ${prompt.title}` 
      : "Customize Prompt";
  
  const safeParameters = Array.isArray(parameters) ? parameters : [];
  const hasParameters = safeParameters.length > 0;
  
  // Memoize the loading component to prevent unnecessary rerenders
  const renderContent = () => {
    if (stableLoading) {
      return <LoadingState />;
    }
    
    if (error) {
      return (
        <ErrorAndRetryState 
          error={error} 
          onClose={handleClose} 
          onRetry={handleRetry} 
          networkStatus={networkStatus}
          errorType={error.includes("not found") ? "not-found" : 
                    error.includes("connection") ? "connection" : "unknown"}
        />
      );
    }
    
    if (!prompt) {
      return (
        <ErrorAndRetryState 
          error="Unable to load prompt details."
          onClose={handleClose} 
          onRetry={handleRetry} 
          networkStatus={networkStatus}
          errorType="not-found"
        />
      );
    }
    
    return (
      <div className="min-h-[350px]">
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
              <p>Total renders: {renderCount.current}</p>
            </div>
          </details>
        </div>
        
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
    );
  };
  
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
        
        <div className="text-xs text-muted-foreground mb-2 p-2 border rounded bg-muted/30">
          Debug Info: Loading: {String(stableLoading)}, Render: {renderCount.current}, 
          Parameters: {safeParameters.length}
        </div>
        
        {renderContent()}
        
        <DialogFooter>
          {error && !stableLoading && (
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
            disabled={!isFormValid() || generating || stableLoading || error !== null || networkStatus === 'offline'}
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
