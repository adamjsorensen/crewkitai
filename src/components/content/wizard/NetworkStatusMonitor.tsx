
import React, { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface NetworkStatusMonitorProps {
  onStatusChange: (status: 'online' | 'offline') => void;
}

const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = ({ onStatusChange }) => {
  const { toast } = useToast();
  
  useEffect(() => {
    const handleOnline = () => {
      onStatusChange('online');
      toast({
        title: "You're back online",
        description: "Reconnected to the server. You can retry loading the prompt.",
      });
    };
    
    const handleOffline = () => {
      onStatusChange('offline');
      toast({
        title: "You're offline",
        description: "Please check your internet connection.",
        variant: "destructive"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    onStatusChange(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange, toast]);
  
  return null; // This is a non-visual component
};

export default NetworkStatusMonitor;
