
import React from 'react';
import { Card } from '@/components/ui/card';
import { PaintBucket } from 'lucide-react';
import TypingIndicator from '@/components/ai-coach/TypingIndicator';

const ThinkingMessage: React.FC = () => {
  return (
    <div className="flex flex-col space-y-2 pb-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 overflow-hidden rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <PaintBucket className="h-5 w-5 text-primary-foreground" />
        </div>
        
        <Card className="p-4 bg-muted/30 border border-border/40 max-w-3xl rounded-lg rounded-tl-none">
          <div className="flex items-center space-x-2">
            <p className="text-muted-foreground text-base">Your AI Coach is thinking...</p>
            <TypingIndicator />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ThinkingMessage;
