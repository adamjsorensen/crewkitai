
import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Pin, 
  ExternalLink,
  Edit,
  Trash2,
  PaintBucket
} from 'lucide-react';

type Conversation = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  pinned: boolean;
};

type ConversationListProps = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  searchQuery: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  searchQuery,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinConversation,
}) => {
  // Filter by search query
  const filteredConversations = conversations
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  
  // Group recent conversations by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const todayConversations = filteredConversations.filter(c => c.timestamp >= today);
  const yesterdayConversations = filteredConversations.filter(c => c.timestamp >= yesterday && c.timestamp < today);
  const lastWeekConversations = filteredConversations.filter(c => c.timestamp >= lastWeek && c.timestamp < yesterday);
  const lastMonthConversations = filteredConversations.filter(c => c.timestamp >= lastMonth && c.timestamp < lastWeek);
  const olderConversations = filteredConversations.filter(c => c.timestamp < lastMonth);
  
  const renderTimeInfo = (date: Date) => {
    // Format as "X hours ago" or "X days ago" for recent items
    const now = new Date();
    const hoursDiff = Math.abs(now.getTime() - date.getTime()) / 36e5; // hours
    
    if (hoursDiff < 48) {
      return formatDistanceToNow(date, { addSuffix: false }) + " ago";
    }
    
    return format(date, 'MMM d');
  };
  
  return (
    <ScrollArea className="h-full px-2">
      {todayConversations.length > 0 && (
        <ConversationGroup 
          title="Today" 
          conversations={todayConversations} 
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onPinConversation={onPinConversation}
          renderTimeInfo={renderTimeInfo}
        />
      )}
      
      {yesterdayConversations.length > 0 && (
        <ConversationGroup 
          title="Yesterday" 
          conversations={yesterdayConversations} 
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onPinConversation={onPinConversation}
          renderTimeInfo={renderTimeInfo}
        />
      )}
      
      {lastWeekConversations.length > 0 && (
        <ConversationGroup 
          title="Last 7 Days" 
          conversations={lastWeekConversations} 
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onPinConversation={onPinConversation}
          renderTimeInfo={renderTimeInfo}
        />
      )}
      
      {lastMonthConversations.length > 0 && (
        <ConversationGroup 
          title="Last 30 Days" 
          conversations={lastMonthConversations} 
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onPinConversation={onPinConversation}
          renderTimeInfo={renderTimeInfo}
        />
      )}
      
      {olderConversations.length > 0 && (
        <ConversationGroup 
          title="Older" 
          conversations={olderConversations} 
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onDeleteConversation={onDeleteConversation}
          onPinConversation={onPinConversation}
          renderTimeInfo={renderTimeInfo}
        />
      )}
      
      {filteredConversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="bg-primary/5 rounded-full p-3 mb-3">
            <PaintBucket className="h-6 w-6 text-primary" />
          </div>
          {searchQuery ? (
            <>
              <p className="text-lg font-medium mb-1">No conversations found</p>
              <p className="text-sm text-muted-foreground">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-1">No conversations yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start a new chat to begin</p>
              <Button 
                onClick={onNewConversation} 
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                Start New Chat
              </Button>
            </>
          )}
        </div>
      )}
    </ScrollArea>
  );
};

interface ConversationGroupProps {
  title: string;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
  renderTimeInfo: (date: Date) => string;
}

const ConversationGroup: React.FC<ConversationGroupProps> = ({
  title,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onDeleteConversation,
  onPinConversation,
  renderTimeInfo
}) => {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-muted-foreground px-2 py-1">{title}</h3>
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <ConversationItem 
            key={conversation.id}
            conversation={conversation}
            isSelected={selectedConversationId === conversation.id}
            onSelect={() => onSelectConversation(conversation.id)}
            onDelete={() => onDeleteConversation(conversation.id)}
            onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
            timeInfo={renderTimeInfo(conversation.timestamp)}
          />
        ))}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
  timeInfo: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onPin,
  timeInfo
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative rounded-md px-3 py-2.5 text-sm transition-colors ${
        isSelected 
          ? 'bg-primary/15 text-primary-foreground' 
          : 'hover:bg-muted/70'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium">{conversation.title}</div>
          <div className="truncate text-xs opacity-70 mt-0.5">{conversation.lastMessage}</div>
        </div>
        
        <div className="flex flex-col items-end ml-2">
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {timeInfo}
          </div>
          
          {conversation.pinned && (
            <Pin className="h-3 w-3 mt-1 fill-primary/60 text-primary/60" />
          )}
        </div>
      </div>
      
      <div className={`absolute right-2 top-2 flex items-center gap-1 ${
        isHovered || isSelected ? 'opacity-100' : 'opacity-0'
      } transition-opacity`}>
        <div className="flex gap-0 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border p-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            title={conversation.pinned ? "Unpin conversation" : "Pin conversation"}
          >
            <Pin 
              className={`h-3.5 w-3.5 ${conversation.pinned ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
            />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-sm text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationList;
