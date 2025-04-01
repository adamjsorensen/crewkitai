
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
import { Loader2, Check, RefreshCw } from "lucide-react";
import { useSimplifiedPromptWizard } from "@/hooks/useSimplifiedPromptWizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllParametersView from "./wizard/AllParametersView";
import AdditionalContextStep from "./wizard/AdditionalContextStep";
import LoadingState from "./wizard/LoadingState";
import ErrorAndRetryState from "./wizard/ErrorAndRetryState";
import NetworkStatusMonitor from "./wizard/NetworkStatusMonitor";
import NetworkStatusAlert from "./wizard/NetworkStatusAlert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
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
  
  const {
    prompt,
    parameters,
    isLoading,
    error,
    generating,
    selectedTweaks,
    additionalContext,
    handleTweakChange,
    setAdditionalContext,
    handleSave,
    isFormValid,
    handleRetry
  } = useSimplifiedPromptWizard(promptId, isOpen, onClose);
  
  // Determine the error type for the error state component
  const getErrorType = () => {
    if (!error) return 'unknown';
    if (error.includes("not found") || error.includes("doesn't exist")) {
      return 'not-found';
    } else if (error.includes("connection") || error.includes("network") || error.includes("Failed to fetch")) {
      return 'connection';
    }
    return 'unknown';
  };
  
  // Log connection issues
  useEffect(() => {
    if (networkStatus === 'offline') {
      console.log("Network is offline - this will affect data loading");
    }
  }, [networkStatus]);
  
  if (!isOpen) return null;
  
  const dialogTitle = isLoading 
    ? "Loading..." 
    : prompt 
      ? `Customize Prompt: ${prompt.title}` 
      : "Customize Prompt";
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{dialogTitle}</DialogTitle>
          <DialogDescription>
            Customize this prompt to generate content tailored to your needs
          </DialogDescription>
        </DialogHeader>
        
        <NetworkStatusMonitor onStatusChange={setNetworkStatus} />
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
                    <p>Has parameters: {parameters && parameters.length > 0 ? 'Yes' : 'No'}</p>
                    <p>Parameters: {JSON.stringify(parameters?.map(p => p.name))}</p>
                    <p>Selected tweaks: {Object.keys(selectedTweaks).length}</p>
                    <p>Network: {networkStatus}</p>
                  </div>
                </details>
              </div>
            )}
            
            {/* Network warning banner */}
            {networkStatus === 'offline' && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Network Error</AlertTitle>
                <AlertDescription>
                  You appear to be offline. Please check your connection and try again.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Parameter empty state notice */}
            {parameters?.length === 0 && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Customization Options</AlertTitle>
                <AlertDescription>
                  This prompt doesn't have any customization parameters. You can add context in the next tab.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="customize" className="flex-1">Customize</TabsTrigger>
                <TabsTrigger value="context" className="flex-1">Add Context</TabsTrigger>
              </TabsList>
              
              <TabsContent value="customize" className="py-4">
                <AllParametersView 
                  parameters={parameters || []} 
                  selectedTweaks={selectedTweaks}
                  onTweakChange={handleTweakChange}
                />
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
