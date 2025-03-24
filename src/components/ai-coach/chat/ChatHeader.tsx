
import React from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onBackClick: () => void;
  onNewChatClick: () => void;
}

const ChatHeader = ({ onBackClick, onNewChatClick }: ChatHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-2 bg-background/95 backdrop-blur-sm border-b">
      <Button
        onClick={onBackClick}
        variant="ghost"
        className="flex items-center gap-2"
        aria-label="Back to AI Coach"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to AI Coach</span>
      </Button>
      <Button
        onClick={onNewChatClick}
        variant="ghost"
        className="flex items-center gap-2"
        aria-label="Start new chat"
      >
        <span>New Chat</span>
        <PlusCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default React.memo(ChatHeader);
