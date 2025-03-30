
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ServerCrash, FileQuestion, RefreshCw } from "lucide-react";

interface ErrorAndRetryStateProps {
  error: string;
  onClose: () => void;
  onRetry: () => void;
  networkStatus?: 'online' | 'offline';
  errorType?: 'connection' | 'not-found' | 'unknown';
}

const ErrorAndRetryState: React.FC<ErrorAndRetryStateProps> = ({ 
  error, 
  onClose, 
  onRetry,
  networkStatus = 'online',
  errorType = 'unknown'
}) => {
  const isOffline = networkStatus === 'offline';
  
  // Select icon based on error type
  let Icon = AlertCircle;
  let title = "Error Loading Prompt";
  let description = error;
  
  if (isOffline) {
    Icon = ServerCrash;
    title = "You're Offline";
    description = "Please check your internet connection and try again.";
  } else if (errorType === 'not-found') {
    Icon = FileQuestion;
    title = "Prompt Not Found";
    description = "The prompt you're looking for doesn't exist or has been removed.";
  } else if (errorType === 'connection') {
    Icon = ServerCrash;
    title = "Connection Error";
    description = "Couldn't connect to the server. Please try again later.";
  }
  
  return (
    <div className="py-8 space-y-6">
      <Alert variant="destructive" className="mb-6">
        <Icon className="h-5 w-5" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {description}
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        
        <Button
          onClick={onRetry}
          disabled={isOffline}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export default ErrorAndRetryState;
