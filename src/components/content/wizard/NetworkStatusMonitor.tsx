
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NetworkStatusMonitorProps {
  onStatusChange: (status: 'online' | 'offline') => void;
}

const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = ({ onStatusChange }) => {
  const { toast } = useToast();
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);
  const [hasShownOnlineToast, setHasShownOnlineToast] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      onStatusChange('online');
      if (hasShownOfflineToast && !hasShownOnlineToast) {
        toast({
          title: "You're back online",
          description: "Reconnected to the server. You can retry loading the prompt.",
        });
        setHasShownOnlineToast(true);
      }
    };
    
    const handleOffline = () => {
      onStatusChange('offline');
      if (!hasShownOfflineToast) {
        toast({
          title: "You're offline",
          description: "Please check your internet connection.",
          variant: "destructive"
        });
        setHasShownOfflineToast(true);
        setHasShownOnlineToast(false);
      }
    };
    
    // Regularly check the connection status
    const checkOnlineStatus = () => {
      const isOnline = navigator.onLine;
      if (isOnline) {
        handleOnline();
      } else {
        handleOffline();
      }
    };
    
    // Initial check
    checkOnlineStatus();
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up an interval to check the connection
    const intervalId = setInterval(checkOnlineStatus, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [onStatusChange, toast, hasShownOfflineToast, hasShownOnlineToast]);
  
  return null; // This is a non-visual component
};

export default NetworkStatusMonitor;
