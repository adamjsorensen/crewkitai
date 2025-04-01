
import React, { useEffect, useCallback, useRef } from "react";

interface NetworkStatusMonitorProps {
  onStatusChange: (status: 'online' | 'offline') => void;
}

const NetworkStatusMonitor: React.FC<NetworkStatusMonitorProps> = ({ onStatusChange }) => {
  // Use a ref to track current status to avoid unnecessary re-renders
  const currentStatusRef = useRef<'online' | 'offline'>(navigator.onLine ? 'online' : 'offline');
  
  // Memoize the handlers to prevent recreation on each render
  const handleOnline = useCallback(() => {
    // Only trigger callback if status actually changed
    if (currentStatusRef.current !== 'online') {
      console.log('[NetworkStatusMonitor] Connection is now online');
      currentStatusRef.current = 'online';
      onStatusChange('online');
    }
  }, [onStatusChange]);
  
  const handleOffline = useCallback(() => {
    // Only trigger callback if status actually changed
    if (currentStatusRef.current !== 'offline') {
      console.log('[NetworkStatusMonitor] Connection is now offline');
      currentStatusRef.current = 'offline';
      onStatusChange('offline');
    }
  }, [onStatusChange]);
  
  useEffect(() => {
    // Initial status - only set if different from current ref
    if (navigator.onLine !== (currentStatusRef.current === 'online')) {
      onStatusChange(navigator.onLine ? 'online' : 'offline');
      currentStatusRef.current = navigator.onLine ? 'online' : 'offline';
    }
    
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
};

export default React.memo(NetworkStatusMonitor);
