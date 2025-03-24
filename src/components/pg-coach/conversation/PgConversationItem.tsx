
import React from 'react';
import { format } from 'date-fns';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
}

interface PgConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}

const PgConversationItem: React.FC<PgConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onTogglePin
}) => {
  return (
    <div 
      key={conversation.id}
      className={`flex p-3 hover:bg-accent cursor-pointer group ${
        isSelected ? 'bg-accent/50' : ''
      }`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <h3 className="font-medium truncate">
            {conversation.title || 'Untitled conversation'}
          </h3>
          {conversation.pinned && (
            <Pin size={14} className="text-primary shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {conversation.lastMessage}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(conversation.timestamp), 'MMM d, yyyy')}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(conversation.id, !conversation.pinned);
          }}
          title={conversation.pinned ? "Unpin conversation" : "Pin conversation"}
        >
          {conversation.pinned ? (
            <PinOff size={14} />
          ) : (
            <Pin size={14} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(conversation.id);
          }}
          title="Delete conversation"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
};

export default PgConversationItem;
