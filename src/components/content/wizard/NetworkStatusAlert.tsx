
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";

interface NetworkStatusAlertProps {
  networkStatus: 'online' | 'offline';
}

const NetworkStatusAlert: React.FC<NetworkStatusAlertProps> = ({ networkStatus }) => {
  if (networkStatus === 'online') return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>You're offline</AlertTitle>
      <AlertDescription>
        Please check your internet connection and try again when you're back online.
      </AlertDescription>
    </Alert>
  );
};

export default NetworkStatusAlert;
