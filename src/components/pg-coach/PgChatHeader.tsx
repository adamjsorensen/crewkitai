
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
    <div className="flex items-center justify-between border-b p-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <PaintBucket className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-medium">PainterGrowth Coach</h1>
          <p className="text-xs text-muted-foreground">Your painting business advisor</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleThinkMode}
          className={isThinkMode ? 'bg-primary/20' : ''}
        >
          {isThinkMode ? 'Thinking...' : 'Think Mode'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNewChat}
        >
          <ListPlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>
    </div>
  );
};

export default PgChatHeader;
