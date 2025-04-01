
import React, { useEffect } from "react";

interface NetworkStatusMonitorProps {
  onStatusChange: (status: 'online' | 'offline') => void;
}

const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = ({ onStatusChange }) => {
  useEffect(() => {
    // Initial status
    onStatusChange(navigator.onLine ? 'online' : 'offline');
    
    // Event handlers
    const handleOnline = () => {
      console.log('[NetworkStatusMonitor] Connection is now online');
      onStatusChange('online');
    };
    
    const handleOffline = () => {
      console.log('[NetworkStatusMonitor] Connection is now offline');
      onStatusChange('offline');
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);
  
  // This is a utility component with no visible UI
  return null;
};

export default NetworkStatusMonitor;
