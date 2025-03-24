
import React from 'react';
import { Loader2 } from 'lucide-react';

interface TypingIndicatorProps {
  withIcon?: boolean;
  text?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  withIcon = true,
  text = "Thinking..." 
}) => {
  return (
    <div className="flex items-center gap-2 text-muted-foreground/80">
      {withIcon && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      <div className="flex items-center">
        <span className="text-sm">{text}</span>
        <div className="flex space-x-1 ml-1">
          <div className="animate-bounce h-1 w-1 bg-primary rounded-full delay-0"></div>
          <div className="animate-bounce h-1 w-1 bg-primary rounded-full delay-150"></div>
          <div className="animate-bounce h-1 w-1 bg-primary rounded-full delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
