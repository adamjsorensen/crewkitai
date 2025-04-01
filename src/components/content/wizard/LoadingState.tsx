
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  key?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ key }) => {
  // Add mount tracking to see if component is remounting
  const mountCount = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    mountCount.current += 1;
    startTimeRef.current = Date.now();
    console.log(`[LoadingState] Component mounted (count: ${mountCount.current}, time: ${new Date().toISOString()})`);
    
    // Track animation frame requests
    let frameCount = 0;
    let lastLogTime = 0;
    
    const trackFrames = (timestamp: number) => {
      frameCount++;
      const now = Date.now();
      
      // Log every second or every 60 frames, whichever comes first
      if (frameCount % 60 === 0 || now - lastLogTime > 1000) {
        const elapsedMs = now - startTimeRef.current;
        console.log(`[LoadingState] Animation frames: ${frameCount}, elapsed: ${elapsedMs}ms, avg FPS: ${(frameCount / (elapsedMs / 1000)).toFixed(1)}`);
        lastLogTime = now;
      }
      
      animationFrameRef.current = requestAnimationFrame(trackFrames);
    };
    
    animationFrameRef.current = requestAnimationFrame(trackFrames);
    
    return () => {
      const unmountTime = Date.now();
      const duration = unmountTime - startTimeRef.current;
      console.log(`[LoadingState] Component unmounted after ${frameCount} frames, duration: ${duration}ms`);
      
      if (duration < 500) {
        console.warn(`[LoadingState] Short-lived component! Only lived for ${duration}ms`);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-300" data-testid="loading-state">
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground font-medium">Loading prompt...</span>
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
