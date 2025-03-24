
import React from 'react';
import { PaintBucket, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PgChatHeaderProps {
  onNewChat: () => void;
}

const PgChatHeader: React.FC<PgChatHeaderProps> = ({ onNewChat }) => {
  return (
    <div className="flex items-center justify-between border-b border-border/40 p-2 bg-background shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
          <PaintBucket className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-none">PainterGrowth Coach</h1>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">Your painting business advisor</p>
        </div>
      </div>
      <div>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs py-0.5 px-2 h-6 hover:bg-primary/5"
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
