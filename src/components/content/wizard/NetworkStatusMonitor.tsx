
import React, { useEffect, useCallback } from "react";

interface NetworkStatusMonitorProps {
  onStatusChange: (status: 'online' | 'offline') => void;
}

const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = React.memo(({ onStatusChange }) => {
  const handleOnline = useCallback(() => {
    console.log('[NetworkStatusMonitor] Connection is now online');
    onStatusChange('online');
  }, [onStatusChange]);
  
  const handleOffline = useCallback(() => {
    console.log('[NetworkStatusMonitor] Connection is now offline');
    onStatusChange('offline');
  }, [onStatusChange]);
  
  useEffect(() => {
    // Initial status
    onStatusChange(navigator.onLine ? 'online' : 'offline');
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline, onStatusChange]);
  
  // This is a utility component with no visible UI
  return null;
});

NetworkStatusMonitor.displayName = "NetworkStatusMonitor";

export default NetworkStatusMonitor;
