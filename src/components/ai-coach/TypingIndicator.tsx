
import React from 'react';
import { cn } from '@/lib/utils';

const TypingIndicator = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center space-x-1.5 px-1", className)}>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1.2s" }}></div>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "300ms", animationDuration: "1.2s" }}></div>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "600ms", animationDuration: "1.2s" }}></div>
    </div>
  );
};

export default TypingIndicator;
