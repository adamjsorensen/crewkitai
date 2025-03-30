
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorAndRetryStateProps {
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  networkStatus: 'online' | 'offline';
  errorType?: 'general' | 'not-found';
}

const ErrorAndRetryState: React.FC<ErrorAndRetryStateProps> = ({
  error,
  onClose,
  onRetry,
  networkStatus,
  errorType = 'general'
}) => {
  return (
    <div className="py-6">
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {errorType === 'not-found' ? "Unable to load prompt" : "Error loading prompt"}
        </AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground mb-4">
          {errorType === 'not-found'
            ? "Unable to load prompt. Please try again or select a different prompt."
            : "Could not load the prompt data. You can try again or select a different prompt."}
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={onRetry} 
            className="gap-2"
            disabled={networkStatus === 'offline'}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorAndRetryState;
