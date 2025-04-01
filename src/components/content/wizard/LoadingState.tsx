
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading prompt..." 
}) => {
  const mountTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    console.log(`[LoadingState] Component mounted at ${new Date().toISOString()}`);
    mountTimeRef.current = Date.now();
    
    return () => {
      const duration = Date.now() - mountTimeRef.current;
      console.log(`[LoadingState] Component unmounted after ${duration}ms`);
    };
  }, []);
  
  return (
    <div 
      className="py-6 space-y-6 animate-in fade-in duration-700" 
      data-testid="loading-state"
    >
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground font-medium">{message}</span>
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
};

export default LoadingState;
