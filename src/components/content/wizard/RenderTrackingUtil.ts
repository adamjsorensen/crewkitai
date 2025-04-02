
import { useRef } from "react";
import { createLogger } from "./WizardLogger";

export class RenderTracker {
  private lastRender: number = 0;
  private renderCount: number = 0;
  private componentName: string;
  private logger = createLogger("RenderTracker");
  
  constructor(componentName: string) {
    this.componentName = componentName;
  }
  
  trackRender() {
    if (process.env.NODE_ENV !== 'production') {
      this.renderCount++;
      const now = Date.now();
      const timeSinceLastRender = now - this.lastRender;
      
      if (this.renderCount % 5 === 0 || (timeSinceLastRender < 100 && this.lastRender !== 0)) {
        this.logger.debug(`${this.componentName} rendered ${this.renderCount} times. Time since last render: ${timeSinceLastRender}ms`);
      }
      
      this.lastRender = now;
    }
  }
}

export function useRenderTracker(componentName: string) {
  const trackerRef = useRef<RenderTracker | null>(null);
  
  if (!trackerRef.current) {
    trackerRef.current = new RenderTracker(componentName);
  }
  
  return trackerRef.current;
}
