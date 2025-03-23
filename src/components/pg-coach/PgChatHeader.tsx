
import React from 'react';
import { PaintBucket, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PgChatHeaderProps {
  isThinkMode: boolean;
  onToggleThinkMode: () => void;
  onNewChat: () => void;
}

const PgChatHeader: React.FC<PgChatHeaderProps> = ({
  isThinkMode,
  onToggleThinkMode,
  onNewChat
}) => {
  return (
    <div className="flex items-center justify-between border-b p-2 bg-background">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
          <PaintBucket className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-medium leading-none">PainterGrowth Coach</h1>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">Your painting business advisor</p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleThinkMode}
          className={`text-xs py-0.5 px-2 h-7 ${isThinkMode ? 'bg-primary/20' : ''}`}
        >
          {isThinkMode ? 'Thinking...' : 'Think Mode'}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs py-0.5 px-2 h-7"
          onClick={onNewChat}
        >
          <ListPlus className="h-3 w-3 mr-1" />
          New Chat
        </Button>
      </div>
    </div>
  );
};

export default PgChatHeader;
