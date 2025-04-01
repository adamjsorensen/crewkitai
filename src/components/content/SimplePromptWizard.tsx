
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import NetworkStatusMonitor from "./wizard/NetworkStatusMonitor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface SimplePromptWizardProps {
  promptId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SimplePromptWizard: React.FC<SimplePromptWizardProps> = React.memo(({ 
  promptId, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState("customize");
  const [showLoadingState, setShowLoadingState] = useState(false);
  
  // Create a stable onClose function
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Use a single hook for all prompt wizard functionality
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
  } = useSimplifiedPromptWizard(promptId, isOpen, handleClose);
  
  // Delayed loading state to prevent flashing - using a more stable approach
  useEffect(() => {
    let timer: number | null = null;
    
    if (isLoading) {
      // Clear any existing timer first
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      
      // Show loading state after a delay to prevent flashes
      timer = window.setTimeout(() => {
        if (isLoading) { // Double-check that we're still loading
          setShowLoadingState(true);
        }
      }, 200); // Slightly longer delay to prevent flickering
    } else {
      // Clear any pending timer
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      
      // Add a small delay before hiding the loading state to prevent flickering
      timer = window.setTimeout(() => {
        setShowLoadingState(false);
      }, 50);
    }
    
    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [isLoading]);
  
  // Effect to log component lifecycle - using a stable object to prevent re-renders
  const logProps = useMemo(() => ({
    promptId,
    isOpen,
    isLoading,
    hasError: !!error
  }), [promptId, isOpen, isLoading, error]);
  
  useEffect(() => {
    console.log(`[SimplePromptWizard] Mounted with:`, logProps);
    
    return () => {
      console.log(`[SimplePromptWizard] Unmounting with promptId: ${promptId}`);
    };
  }, [logProps, promptId]);
  
  // Log parameters when they change, but only if they actually change
  const parametersCount = parameters?.length || 0;
  useEffect(() => {
    if (parametersCount > 0) {
      console.log(`[SimplePromptWizard] Parameters loaded: ${parametersCount}`);
    }
  }, [parametersCount]);
  
  // Memoize various computed values to prevent re-renders
  const dialogTitle = useMemo(() => {
    if (showLoadingState) return "Loading...";
    return prompt ? `Customize Prompt: ${prompt.title}` : "Customize Prompt";
  }, [showLoadingState, prompt]);
  
  const safeParameters = useMemo(() => 
    Array.isArray(parameters) ? parameters : [],
    [parameters]
  );
  
  const hasParameters = safeParameters.length > 0;
  
  if (!isOpen) return null;
  
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
        
        {/* Monitor network status without causing re-renders */}
        <NetworkStatusMonitor onStatusChange={(status) => {
          // Only update if different from current state
          if (status !== networkStatus) {
            // Use function form to avoid stale closure issues
            console.log(`[SimplePromptWizard] Network status updated to: ${status}`);
          }
        }} />
        
        <NetworkStatusAlert networkStatus={networkStatus} />
        
        {/* Show loading state */}
        {showLoadingState && <LoadingState />}
        
        {/* Show error state */}
        {!showLoadingState && error && (
          <ErrorAndRetryState 
            error={error} 
            onClose={handleClose} 
            onRetry={handleRetry} 
            networkStatus={networkStatus}
            errorType={error.includes("not found") ? "not-found" : 
                      error.includes("connection") ? "connection" : "unknown"}
          />
        )}
        
        {/* Show content when not loading and no error */}
        {!showLoadingState && !error && prompt && (
          <div className="min-h-[350px]">
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
              
              <TabsContent value="customize" className="py-4 min-h-[300px]">
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
              
              <TabsContent value="context" className="py-4 min-h-[300px]">
                <AdditionalContextStep 
                  additionalContext={additionalContext} 
                  setAdditionalContext={setAdditionalContext}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          {error && !showLoadingState && (
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
            disabled={!isFormValid() || generating || showLoadingState || error !== null || networkStatus === 'offline'}
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
});

SimplePromptWizard.displayName = 'SimplePromptWizard';

export default SimplePromptWizard;
