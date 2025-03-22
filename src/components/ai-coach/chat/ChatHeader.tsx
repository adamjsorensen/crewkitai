
import React from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';

interface ChatHeaderProps {
  onBackClick: () => void;
  onNewChatClick: () => void;
}

const ChatHeader = ({ onBackClick, onNewChatClick }: ChatHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between p-2 bg-background/95 backdrop-blur-sm border-b">
      <button
        onClick={onBackClick}
        className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="ml-1">Back to AI Coach</span>
      </button>
      <button
        onClick={onNewChatClick}
        className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span className="mr-1">New Chat</span>
        <PlusCircle className="h-5 w-5" />
      </button>
    </div>
  );
};

export default React.memo(ChatHeader);
