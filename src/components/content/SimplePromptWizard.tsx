
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSimplifiedPromptWizard } from "@/hooks/useSimplifiedPromptWizard";
import LoadingState from "./wizard/LoadingState";
import ErrorAndRetryState from "./wizard/ErrorAndRetryState";
import NetworkStatusAlert from "./wizard/NetworkStatusAlert";
import DebugModePanel from "./wizard/DebugModePanel";
import { createLogger } from "./wizard/WizardLogger";
import { useRenderTracker } from "./wizard/RenderTrackingUtil";
import SimpleWizardHeader from "./wizard/SimpleWizardHeader";
import SimpleWizardContent from "./wizard/SimpleWizardContent";
import SimpleWizardFooter from "./wizard/SimpleWizardFooter";

const logger = createLogger("SimplePromptWizard");

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
  const renderTracker = useRenderTracker('SimplePromptWizard');
  
  if (process.env.NODE_ENV !== 'production') {
    renderTracker.trackRender();
  }
  
  const [activeTab, setActiveTab] = useState("customize");
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [stableOpen, setStableOpen] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [forceRefreshCount, setForceRefreshCount] = useState(0);
  
  // Default to disabled in all environments, only enable via keyboard shortcut
  const [isDebugMode, setIsDebugMode] = useState(false);
  
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
    if (parameters?.length > 0 && process.env.NODE_ENV !== 'production') {
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
    
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`Creating safeParameters with ${result.length} items, updating UI`);
    }
    
    return result;
  }, [parameters]);
  
  const hasParameters = useMemo(() => {
    return safeParameters.length > 0;
  }, [safeParameters]);
  
  const shouldShowContent = useMemo(() => {
    const shouldShow = !showLoadingState && !error && prompt && (initialLoadComplete || !isLoading);
    
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`Should show content: ${shouldShow} (showLoadingState=${showLoadingState}, error=${!!error}, prompt=${!!prompt}, initialLoadComplete=${initialLoadComplete})`);
    }
    
    return shouldShow;
  }, [showLoadingState, error, prompt, initialLoadComplete, isLoading]);
  
  const dialogTitle = useMemo(() => {
    if (showLoadingState) return "Loading...";
    return prompt ? `Customize Prompt: ${prompt.title}` : "Customize Prompt";
  }, [showLoadingState, prompt]);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
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
        <SimpleWizardHeader 
          dialogTitle={dialogTitle}
          networkStatus={networkStatus}
          error={error}
        />
        
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
        
        <SimpleWizardContent
          shouldShowContent={shouldShowContent}
          showLoadingState={showLoadingState}
          error={error}
          hasParameters={hasParameters}
          safeParameters={safeParameters}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedTweaks={selectedTweaks}
          handleTweakChange={handleTweakChange}
          additionalContext={additionalContext}
          setAdditionalContext={setAdditionalContext}
          onForceRefresh={handleForceRefresh}
        />
        
        <SimpleWizardFooter
          error={error}
          showLoadingState={showLoadingState}
          generating={generating}
          isFormValid={isFormValid}
          networkStatus={networkStatus}
          isDebugMode={isDebugMode}
          handleSave={handleSave}
          handleRetry={handleRetry}
          handleForceRefresh={handleForceRefresh}
        />
      </DialogContent>
    </Dialog>
  );
});

SimplePromptWizard.displayName = "SimplePromptWizard";

export default SimplePromptWizard;
