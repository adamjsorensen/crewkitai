
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

// Create a separate memoized component for the tabs content
const TabsContentSection = React.memo(({ 
  activeTab, 
  hasParameters, 
  safeParameters, 
  selectedTweaks, 
  handleTweakChange, 
  additionalContext, 
  setAdditionalContext 
}: { 
  activeTab: string; 
  hasParameters: boolean; 
  safeParameters: any[]; 
  selectedTweaks: Record<string, string>; 
  handleTweakChange: (parameterId: string, tweakId: string) => void;
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
}) => {
  return (
    <>
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
    </>
  );
});

TabsContentSection.displayName = "TabsContentSection";

const SimplePromptWizard: React.FC<SimplePromptWizardProps> = React.memo(({ 
  promptId, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState("customize");
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [didMount, setDidMount] = useState(false);
  const [stableOpen, setStableOpen] = useState(false);
  
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
  } = useSimplifiedPromptWizard(promptId, stableOpen, handleClose);
  
  // Stabilize the open state to prevent re-rendering loops
  useEffect(() => {
    if (isOpen !== stableOpen) {
      setStableOpen(isOpen);
    }
  }, [isOpen, stableOpen]);

  // Delayed loading state to prevent flashing
  useEffect(() => {
    const timer = isLoading 
      ? setTimeout(() => setShowLoadingState(true), 200)
      : setTimeout(() => setShowLoadingState(false), 300);
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  // Mark component as mounted only once to prevent re-rendering cycles
  useEffect(() => {
    if (!didMount) {
      console.log("[SimplePromptWizard] Component mounted once and stable");
      setDidMount(true);
    }
  }, []);
  
  // Effect to log component lifecycle - reduced frequency
  useEffect(() => {
    if (didMount) {
      console.log(`[SimplePromptWizard] State update: promptId=${promptId}, isLoading=${isLoading}, hasParameters=${parameters?.length || 0}`);
    }
  }, [promptId, isLoading, parameters, didMount]);
  
  // Safeguard against dialog closing when we don't want it to
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isLoading && !generating) {
      handleClose();
    }
  }, [handleClose, isLoading, generating]);
  
  // Safely access parameters with memo to prevent recomputation
  const safeParameters = useMemo(() => {
    return Array.isArray(parameters) ? parameters : [];
  }, [parameters]);
  
  const hasParameters = safeParameters.length > 0;
  
  const dialogTitle = useMemo(() => {
    if (showLoadingState) return "Loading...";
    return prompt ? `Customize Prompt: ${prompt.title}` : "Customize Prompt";
  }, [showLoadingState, prompt]);
  
  if (!stableOpen) return null;
  
  return (
    <Dialog open={stableOpen} onOpenChange={handleOpenChange}>
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
        {showLoadingState && <LoadingState message="Loading prompt customization options..." />}
        
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
        
        {/* Show content when not loading and no error - ONLY when we have data */}
        {!showLoadingState && !error && prompt && (
          <div className="min-h-[350px]">
            {process.env.NODE_ENV === 'development' && (
              <Alert className="mb-2 bg-yellow-50 border-yellow-300">
                <Info className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-xs text-yellow-800">
                  Debug: Parameters count: {safeParameters.length}
                </AlertDescription>
              </Alert>
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
              
              {/* Use the memoized component for tabs content */}
              <TabsContentSection
                activeTab={activeTab}
                hasParameters={hasParameters}
                safeParameters={safeParameters}
                selectedTweaks={selectedTweaks}
                handleTweakChange={handleTweakChange}
                additionalContext={additionalContext}
                setAdditionalContext={setAdditionalContext}
              />
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
