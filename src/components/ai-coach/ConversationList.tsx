
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Pin, 
  ChevronRight, 
  ChevronDown, 
  MessageSquare, 
  Trash2,
  PlusCircle 
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
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinConversation: (id: string, pinned: boolean) => void;
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinned, setShowPinned] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  
  // Filter and sort conversations
  const pinnedConversations = conversations
    .filter(c => c.pinned)
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  const recentConversations = conversations
    .filter(c => !c.pinned)
    .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Group recent conversations by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const todayConversations = recentConversations.filter(c => c.timestamp >= today);
  const yesterdayConversations = recentConversations.filter(c => c.timestamp >= yesterday && c.timestamp < today);
  const lastWeekConversations = recentConversations.filter(c => c.timestamp >= lastWeek && c.timestamp < yesterday);
  const lastMonthConversations = recentConversations.filter(c => c.timestamp >= lastMonth && c.timestamp < lastWeek);
  const olderConversations = recentConversations.filter(c => c.timestamp < lastMonth);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-3">
        <Button 
          onClick={onNewConversation} 
          className="w-full justify-start"
          variant="secondary"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New conversation
        </Button>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {pinnedConversations.length > 0 && (
            <Collapsible open={showPinned} onOpenChange={setShowPinned}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2 font-medium">
                  <div className="flex items-center">
                    <Pin className="h-3.5 w-3.5 mr-1.5" />
                    <span>Pinned</span>
                  </div>
                  {showPinned ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {pinnedConversations.map((conversation) => (
                  <ConversationItem 
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversationId === conversation.id}
                    onSelect={() => onSelectConversation(conversation.id)}
                    onDelete={() => onDeleteConversation(conversation.id)}
                    onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
          
          <Collapsible open={showRecent} onOpenChange={setShowRecent}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-2 font-medium">
                <div className="flex items-center">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  <span>Recent</span>
                </div>
                {showRecent ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {todayConversations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground px-2 py-1">Today</p>
                  {todayConversations.map((conversation) => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation.id)}
                      onDelete={() => onDeleteConversation(conversation.id)}
                      onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
                    />
                  ))}
                </div>
              )}
              
              {yesterdayConversations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground px-2 py-1">Yesterday</p>
                  {yesterdayConversations.map((conversation) => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation.id)}
                      onDelete={() => onDeleteConversation(conversation.id)}
                      onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
                    />
                  ))}
                </div>
              )}
              
              {lastWeekConversations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground px-2 py-1">Last 7 days</p>
                  {lastWeekConversations.map((conversation) => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation.id)}
                      onDelete={() => onDeleteConversation(conversation.id)}
                      onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
                    />
                  ))}
                </div>
              )}
              
              {lastMonthConversations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground px-2 py-1">Last 30 days</p>
                  {lastMonthConversations.map((conversation) => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation.id)}
                      onDelete={() => onDeleteConversation(conversation.id)}
                      onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
                    />
                  ))}
                </div>
              )}
              
              {olderConversations.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground px-2 py-1">Older</p>
                  {olderConversations.map((conversation) => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation.id)}
                      onDelete={() => onDeleteConversation(conversation.id)}
                      onPin={() => onPinConversation(conversation.id, !conversation.pinned)}
                    />
                  ))}
                </div>
              )}
              
              {recentConversations.length === 0 && searchQuery && (
                <p className="text-sm text-center py-3 text-muted-foreground">No conversations found</p>
              )}
              
              {recentConversations.length === 0 && !searchQuery && (
                <p className="text-sm text-center py-3 text-muted-foreground">No recent conversations</p>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onPin,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`relative rounded-lg px-3 py-2 text-sm transition-colors ${
        isSelected 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-muted/80'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      <div className="truncate font-medium">{conversation.title}</div>
      <div className="truncate text-xs opacity-70">{conversation.lastMessage}</div>
      
      <div className={`absolute right-2 top-2 flex items-center gap-0.5 ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
        >
          <Pin 
            className={`h-3.5 w-3.5 ${conversation.pinned ? 'fill-current' : ''}`} 
          />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ConversationList;
