
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
  
  // Delayed loading state to prevent flashing with debounce
  useEffect(() => {
    let timer: number | null = null;
    
    if (isLoading) {
      // Show loading state after a small delay to prevent flashes
      timer = window.setTimeout(() => {
        setShowLoadingState(true);
      }, 150); // Slightly longer delay to reduce flickering
    } else {
      // Small delay before hiding loading state to prevent flickering
      timer = window.setTimeout(() => {
        setShowLoadingState(false);
      }, 50);
    }
    
    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [isLoading]);
  
  // Effect to log component lifecycle
  useEffect(() => {
    console.log(`[SimplePromptWizard] Mounted with promptId: ${promptId}, isOpen: ${isOpen}`);
    console.log(`[SimplePromptWizard] Loading state: ${isLoading}, Error: ${error ? 'yes' : 'no'}`);
    
    return () => {
      console.log(`[SimplePromptWizard] Unmounting with promptId: ${promptId}`);
    };
  }, [promptId, isOpen, isLoading, error]);
  
  // Log parameters when they change
  useEffect(() => {
    if (parameters?.length > 0) {
      console.log(`[SimplePromptWizard] Parameters loaded: ${parameters.length}`);
    }
  }, [parameters]);
  
  if (!isOpen) return null;
  
  const dialogTitle = useMemo(() => {
    if (showLoadingState) return "Loading...";
    return prompt ? `Customize Prompt: ${prompt.title}` : "Customize Prompt";
  }, [showLoadingState, prompt]);
  
  // Safely access parameters
  const safeParameters = useMemo(() => {
    return Array.isArray(parameters) ? parameters : [];
  }, [parameters]);
  
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

SimplePromptWizard.displayName = "SimplePromptWizard";

export default SimplePromptWizard;
