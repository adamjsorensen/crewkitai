
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

interface NetworkStatusAlertProps {
  networkStatus: 'online' | 'offline';
}

const NetworkStatusAlert: React.FC<NetworkStatusAlertProps> = ({
  networkStatus
}) => {
  if (networkStatus === 'online') {
    return null;
  }

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50">
      <WifiOff className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-amber-700">
        You appear to be offline. Please check your internet connection to continue customizing prompts.
      </AlertDescription>
    </Alert>
  );
};

export default NetworkStatusAlert;
