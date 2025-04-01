
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
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[SimplePromptWizard] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[SimplePromptWizard] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[SimplePromptWizard] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[SimplePromptWizard] ${message}`, ...args);
  }
};

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
  // Log rendering conditionally
  if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
    logger.debug(`TabsContentSection rendering with ${safeParameters.length} parameters`);
  }
  
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

// Performance monitoring wrapper
class RenderTracker {
  private lastRender: number = 0;
  private renderCount: number = 0;
  private componentName: string;
  
  constructor(componentName: string) {
    this.componentName = componentName;
  }
  
  trackRender() {
    if (CURRENT_LOG_LEVEL < LOG_LEVEL.DEBUG) return;
    
    this.renderCount++;
    const now = Date.now();
    const timeSinceLastRender = now - this.lastRender;
    
    // Only log every 5th render or if renders are happening rapidly
    if (this.renderCount % 5 === 0 || (timeSinceLastRender < 100 && this.lastRender !== 0)) {
      logger.debug(`${this.componentName} rendered ${this.renderCount} times. Time since last render: ${timeSinceLastRender}ms`);
    }
    
    this.lastRender = now;
  }
}

const SimplePromptWizard: React.FC<SimplePromptWizardProps> = React.memo(({ 
  promptId, 
  isOpen, 
  onClose 
}) => {
  const renderTracker = useMemo(() => new RenderTracker('SimplePromptWizard'), []);
  
  // Track renders in development mode
  if (process.env.NODE_ENV !== 'production') {
    renderTracker.trackRender();
  }
  
  const [activeTab, setActiveTab] = useState("customize");
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [didMount, setDidMount] = useState(false);
  const [stableOpen, setStableOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingStateTimeoutId, setLoadingStateTimeoutId] = useState<number | null>(null);
  
  // Create a stable onClose function
  const handleClose = useCallback(() => {
    // Clear any pending timeouts
    if (loadingStateTimeoutId) {
      window.clearTimeout(loadingStateTimeoutId);
      setLoadingStateTimeoutId(null);
    }
    
    onClose();
  }, [onClose, loadingStateTimeoutId]);
  
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
      // Reset initial load state when opening/closing
      if (isOpen) {
        setInitialLoadComplete(false);
      }
    }
  }, [isOpen, stableOpen]);

  // Use a more stable approach for loading state with cleanup
  useEffect(() => {
    // Clear any existing timeout when deps change
    if (loadingStateTimeoutId) {
      window.clearTimeout(loadingStateTimeoutId);
      setLoadingStateTimeoutId(null);
    }
    
    let newTimeoutId: number | null = null;
    
    if (isLoading && !showLoadingState) {
      // Set loading state with a delay to prevent flashing
      newTimeoutId = window.setTimeout(() => {
        setShowLoadingState(true);
        setLoadingStateTimeoutId(null);
      }, 200);
      
      setLoadingStateTimeoutId(newTimeoutId);
    } else if (!isLoading && showLoadingState) {
      // Only set initialLoadComplete if this is the first load completing
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
      
      // Add a delay before hiding loading state
      newTimeoutId = window.setTimeout(() => {
        setShowLoadingState(false);
        setLoadingStateTimeoutId(null);
      }, 300);
      
      setLoadingStateTimeoutId(newTimeoutId);
    }
    
    return () => {
      if (newTimeoutId) {
        window.clearTimeout(newTimeoutId);
      }
    };
  }, [isLoading, showLoadingState, initialLoadComplete]);
  
  // Mark component as mounted only once to prevent re-rendering cycles
  useEffect(() => {
    if (!didMount) {
      logger.debug("Component mounted once and stable");
      setDidMount(true);
    }
    
    // Cleanup timeouts on unmount
    return () => {
      if (loadingStateTimeoutId) {
        window.clearTimeout(loadingStateTimeoutId);
      }
    };
  }, [didMount, loadingStateTimeoutId]);
  
  // Effect to log component lifecycle - reduced frequency and with better debugging
  useEffect(() => {
    if (didMount && CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`State update: promptId=${promptId}, isLoading=${isLoading}, showLoadingState=${showLoadingState}, initialLoadComplete=${initialLoadComplete}, hasParameters=${parameters?.length || 0}`);
    }
  }, [promptId, isLoading, parameters, didMount, showLoadingState, initialLoadComplete]);
  
  // Safeguard against dialog closing when we don't want it to
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isLoading && !generating) {
      handleClose();
    }
  }, [handleClose, isLoading, generating]);
  
  // Safely access parameters with memo to prevent recomputation
  const safeParameters = useMemo(() => {
    const result = Array.isArray(parameters) ? parameters : [];
    
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Creating safeParameters with ${result.length} items`);
    }
    
    return result;
  }, [parameters]);
  
  const hasParameters = safeParameters.length > 0;
  
  // Compute if content should be shown - with proper dependency tracking
  const shouldShowContent = useMemo(() => {
    const shouldShow = !showLoadingState && !error && prompt && initialLoadComplete;
    
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Should show content: ${shouldShow} (showLoadingState=${showLoadingState}, error=${!!error}, prompt=${!!prompt}, initialLoadComplete=${initialLoadComplete})`);
    }
    
    return shouldShow;
  }, [showLoadingState, error, prompt, initialLoadComplete]);
  
  // Compute dialog title once
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
        {shouldShowContent && (
          <div className="min-h-[350px]">
            {process.env.NODE_ENV === 'development' && CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG && (
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
