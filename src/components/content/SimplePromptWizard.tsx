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
import DebugModePanel from "./wizard/DebugModePanel";

const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.DEBUG;

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

const TabsContentSection = React.memo(({ 
  activeTab, 
  hasParameters, 
  safeParameters, 
  selectedTweaks, 
  handleTweakChange, 
  additionalContext, 
  setAdditionalContext,
  onForceRefresh 
}: { 
  activeTab: string; 
  hasParameters: boolean; 
  safeParameters: any[]; 
  selectedTweaks: Record<string, string>; 
  handleTweakChange: (parameterId: string, tweakId: string) => void;
  additionalContext: string;
  setAdditionalContext: (value: string) => void;
  onForceRefresh?: () => void;
}) => {
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
            onForceRefresh={onForceRefresh}
          />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No customization options available for this prompt.</p>
            <p className="mt-2">You can add additional context in the next tab.</p>
            
            {process.env.NODE_ENV !== 'production' && onForceRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onForceRefresh} 
                className="mt-4"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Force Refresh
              </Button>
            )}
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
  
  if (process.env.NODE_ENV !== 'production') {
    renderTracker.trackRender();
  }
  
  const [activeTab, setActiveTab] = useState("customize");
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [stableOpen, setStableOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [forceRefreshCount, setForceRefreshCount] = useState(0);
  
  const handleClose = useCallback(() => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    onClose();
  }, [onClose, loadingTimeout]);
  
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
    handleRetry,
    forceRefreshData
  } = useSimplifiedPromptWizard(promptId, stableOpen, handleClose, forceRefreshCount);
  
  const handleForceRefresh = useCallback(() => {
    logger.info("Force refresh requested");
    setForceRefreshCount(prev => prev + 1);
    
    if (typeof forceRefreshData === 'function') {
      forceRefreshData();
    }
  }, [forceRefreshData]);
  
  useEffect(() => {
    if (isOpen !== stableOpen) {
      setStableOpen(isOpen);
      if (isOpen) {
        setInitialLoadComplete(false);
        logger.debug("Dialog opened, resetting state");
      }
    }
  }, [isOpen, stableOpen]);
  
  useEffect(() => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
    
    if (isLoading && !showLoadingState) {
      const timeout = setTimeout(() => {
        logger.debug("Loading timeout triggered, showing loading state");
        setShowLoadingState(true);
      }, 300);
      
      setLoadingTimeout(timeout);
    } else if (!isLoading && showLoadingState) {
      if (!initialLoadComplete) {
        logger.debug("Initial load complete");
        setInitialLoadComplete(true);
      }
      
      const timeout = setTimeout(() => {
        logger.debug("Hiding loading state");
        setShowLoadingState(false);
      }, 300);
      
      setLoadingTimeout(timeout);
    }
    
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [isLoading, showLoadingState, initialLoadComplete]);
  
  useEffect(() => {
    if (parameters?.length > 0 && CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Parameters updated: count=${parameters.length}`);
      
      if (parameters.length > 0) {
        const firstParam = parameters[0];
        logger.debug(`First parameter: ${firstParam.name}, tweaks: ${firstParam.tweaks?.length || 0}`);
      }
    }
  }, [parameters]);
  
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open && !isLoading && !generating) {
      handleClose();
    }
  }, [handleClose, isLoading, generating]);
  
  const safeParameters = useMemo(() => {
    const result = Array.isArray(parameters) ? parameters : [];
    
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Creating safeParameters with ${result.length} items, updating UI`);
    }
    
    return result;
  }, [parameters]);
  
  const hasParameters = useMemo(() => {
    return safeParameters.length > 0;
  }, [safeParameters]);
  
  const shouldShowContent = useMemo(() => {
    const shouldShow = !showLoadingState && !error && prompt && (initialLoadComplete || !isLoading);
    
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Should show content: ${shouldShow} (showLoadingState=${showLoadingState}, error=${!!error}, prompt=${!!prompt}, initialLoadComplete=${initialLoadComplete})`);
    }
    
    return shouldShow;
  }, [showLoadingState, error, prompt, initialLoadComplete, isLoading]);
  
  const dialogTitle = useMemo(() => {
    if (showLoadingState) return "Loading...";
    return prompt ? `Customize Prompt: ${prompt.title}` : "Customize Prompt";
  }, [showLoadingState, prompt]);
  
  useEffect(() => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Parameters state: count=${safeParameters.length}, hasParameters=${hasParameters}, shouldShowContent=${shouldShowContent}`);
    }
  }, [safeParameters, hasParameters, shouldShowContent]);
  
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, []);
  
  const [isDebugMode, setIsDebugMode] = useState(() => {
    if (process.env.NODE_ENV !== 'production') return true;
    return localStorage.getItem('crewkit_debug_mode') === 'true';
  });
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsDebugMode(prev => {
          const newValue = !prev;
          if (process.env.NODE_ENV === 'production') {
            localStorage.setItem('crewkit_debug_mode', newValue.toString());
          }
          return newValue;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
        
        <DebugModePanel 
          isEnabled={isDebugMode}
          error={error}
          networkStatus={networkStatus}
          isLoading={isLoading}
          isGenerating={generating}
          promptId={promptId}
          parametersCount={safeParameters.length}
          selectedTweaksCount={Object.keys(selectedTweaks).length}
          onForceRefresh={handleForceRefresh}
          onRetry={handleRetry}
        />
        
        {showLoadingState && <LoadingState message="Loading prompt customization options..." />}
        
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
        
        {shouldShowContent && (
          <div className="min-h-[350px]">
            {!hasParameters && safeParameters.length === 0 && (
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
              
              <TabsContentSection
                activeTab={activeTab}
                hasParameters={hasParameters}
                safeParameters={safeParameters}
                selectedTweaks={selectedTweaks}
                handleTweakChange={handleTweakChange}
                additionalContext={additionalContext}
                setAdditionalContext={setAdditionalContext}
                onForceRefresh={handleForceRefresh}
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
          
          {isDebugMode && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleForceRefresh} 
              className="mr-auto text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Force Refresh
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
