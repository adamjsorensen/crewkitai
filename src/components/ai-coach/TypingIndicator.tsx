
import React from 'react';
import { cn } from '@/lib/utils';

const TypingIndicator = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }}></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "300ms" }}></div>
      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "600ms" }}></div>
    </div>
  );
};

export default TypingIndicator;
