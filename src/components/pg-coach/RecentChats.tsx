
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePgConversations } from '@/hooks/usePgConversations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MessageSquare } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const RecentChats = () => {
  const { conversations, isLoading, selectConversation } = usePgConversations();
  const navigate = useNavigate();
  
  const handleChatClick = (id: string) => {
    selectConversation(id);
    navigate('/dashboard/ai-coach');
  };
  
  const handleViewAllClick = () => {
    navigate('/dashboard/ai-coach');
  };
  
  const formatChatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isWithinWeek = now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
    
    if (isToday) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isWithinWeek) {
      return format(date, 'EEEE');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent AI Conversations</span>
          <button 
            onClick={handleViewAllClick}
            className="text-sm text-primary hover:underline flex items-center"
          >
            View All <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </CardTitle>
        <CardDescription>Your recent conversations with PainterGrowth AI Coach</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">You haven't had any conversations yet</p>
            <button 
              onClick={handleViewAllClick}
              className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors mx-auto"
            >
              <MessageSquare className="h-5 w-5" />
              Start a Conversation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conversation) => (
              <div 
                key={conversation.id} 
                className="p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleChatClick(conversation.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{conversation.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatChatDate(conversation.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {conversation.lastMessage}
                </p>
                {conversation.pinned && (
                  <div className="mt-1">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                      Pinned
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentChats;
