
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  timeoutWarningThreshold?: number;
}

// Logging levels control
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Set this to control logging verbosity
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN;

// Custom logger to control logging
const logger = {
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.ERROR) console.error(`[LoadingState] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.WARN) console.warn(`[LoadingState] ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) console.log(`[LoadingState] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) console.log(`[LoadingState] ${message}`, ...args);
  }
};

const LoadingState: React.FC<LoadingStateProps> = React.memo(({ 
  message = "Loading prompt...",
  timeoutWarningThreshold = 5000
}) => {
  const mountTimeRef = useRef<number>(Date.now());
  const updateIntervalRef = useRef<number | null>(null);
  const [loadingTime, setLoadingTime] = React.useState<number>(0);
  const [showDebugInfo, setShowDebugInfo] = React.useState(process.env.NODE_ENV !== 'production');
  
  useEffect(() => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
      logger.debug(`Component mounted at ${new Date().toISOString()}`);
    }
    
    mountTimeRef.current = Date.now();
    
    // Update loading time every second
    updateIntervalRef.current = window.setInterval(() => {
      const currentDuration = Date.now() - mountTimeRef.current;
      setLoadingTime(currentDuration);
      
      // Log every 2 seconds
      if (currentDuration > 0 && currentDuration % 2000 < 100 && CURRENT_LOG_LEVEL >= LOG_LEVEL.INFO) {
        logger.info(`Still loading after ${Math.floor(currentDuration / 1000)}s`);
      }
    }, 1000);
    
    return () => {
      const duration = Date.now() - mountTimeRef.current;
      
      if (CURRENT_LOG_LEVEL >= LOG_LEVEL.DEBUG) {
        logger.debug(`Component unmounted after ${duration}ms`);
      }
      
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);
  
  // Add warning if loading takes too long
  const loadingWarning = loadingTime > timeoutWarningThreshold ? (
    <p className="text-xs text-amber-600 text-center mt-2">
      Loading is taking longer than expected... 
      {showDebugInfo && <span> ({Math.floor(loadingTime / 1000)}s)</span>}
    </p>
  ) : null;
  
  // Toggle debug info
  const toggleDebugInfo = () => {
    setShowDebugInfo(prev => !prev);
  };
  
  return (
    <div 
      className="py-6 space-y-6 animate-in fade-in duration-700" 
      data-testid="loading-state"
    >
      <div className="flex justify-center items-center py-4 flex-col">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground font-medium">{message}</span>
        </div>
        {loadingWarning}
        {showDebugInfo && process.env.NODE_ENV !== 'production' && (
          <div className="mt-2 text-xs text-muted-foreground">
            <button 
              onClick={toggleDebugInfo} 
              className="text-xs text-blue-500 hover:underline"
            >
              Hide debug info
            </button>
            <div className="mt-1">Loading time: {Math.floor(loadingTime / 1000)}s</div>
          </div>
        )}
        {!showDebugInfo && process.env.NODE_ENV !== 'production' && loadingTime > 3000 && (
          <button 
            onClick={toggleDebugInfo} 
            className="mt-2 text-xs text-blue-500 hover:underline"
          >
            Show debug info
          </button>
        )}
      </div>
      
      <Card className="bg-muted/40">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
});

LoadingState.displayName = "LoadingState";

export default LoadingState;
