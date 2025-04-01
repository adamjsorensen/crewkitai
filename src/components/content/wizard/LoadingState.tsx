
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = React.memo(({ 
  message = "Loading prompt..." 
}) => {
  const mountTimeRef = useRef<number>(Date.now());
  const updateInterval = useRef<number | null>(null);
  const [loadingTime, setLoadingTime] = React.useState<number>(0);
  
  useEffect(() => {
    console.log(`[LoadingState] Component mounted at ${new Date().toISOString()}`);
    mountTimeRef.current = Date.now();
    
    // Update loading time every second for debugging
    updateInterval.current = window.setInterval(() => {
      const currentDuration = Date.now() - mountTimeRef.current;
      setLoadingTime(currentDuration);
      
      // Log every 2 seconds
      if (currentDuration > 0 && currentDuration % 2000 < 100) {
        console.log(`[LoadingState] Still loading after ${Math.floor(currentDuration / 1000)}s`);
      }
    }, 1000);
    
    return () => {
      const duration = Date.now() - mountTimeRef.current;
      console.log(`[LoadingState] Component unmounted after ${duration}ms`);
      
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);
  
  // Add warning if loading takes too long
  const loadingWarning = loadingTime > 5000 ? (
    <p className="text-xs text-amber-600 text-center mt-2">
      Loading is taking longer than expected...
    </p>
  ) : null;
  
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
