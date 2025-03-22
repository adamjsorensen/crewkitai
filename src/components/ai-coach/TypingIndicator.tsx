
import React from 'react';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';

const TypingIndicator = ({ className, withIcon = false }: { className?: string, withIcon?: boolean }) => {
  return (
    <div className={cn("flex items-center space-x-1.5 px-1", className)}>
      {withIcon && (
        <Brain className="h-4 w-4 mr-2 text-primary animate-pulse" />
      )}
      <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1.2s" }}></div>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "300ms", animationDuration: "1.2s" }}></div>
      <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" style={{ animationDelay: "600ms", animationDuration: "1.2s" }}></div>
    </div>
  );
};

export default TypingIndicator;
