
import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { createLogger } from "./WizardLogger";

const logger = createLogger("SimpleWizardFooter");

interface SimpleWizardFooterProps {
  error: string | null;
  showLoadingState: boolean;
  generating: boolean;
  isFormValid: () => boolean;
  networkStatus: 'online' | 'offline';
  isDebugMode: boolean;
  handleSave: () => void;
  handleRetry: () => void;
  handleForceRefresh: () => void;
}

const SimpleWizardFooter: React.FC<SimpleWizardFooterProps> = ({
  error,
  showLoadingState,
  generating,
  isFormValid,
  networkStatus,
  isDebugMode,
  handleSave,
  handleRetry,
  handleForceRefresh
}) => {
  return (
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
  );
};

export default SimpleWizardFooter;
