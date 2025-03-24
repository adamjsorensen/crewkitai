
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePgConversations } from '@/hooks/usePgConversations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MessageSquare, PaintBucket, Pin } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const RecentChats = () => {
  const { conversations, isLoading, selectConversation } = usePgConversations();
  const navigate = useNavigate();
  
  const handleChatClick = (id: string) => {
    selectConversation(id);
    navigate('/dashboard/pg-coach');
  };
  
  const handleViewAllClick = () => {
    navigate('/dashboard/pg-coach');
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
    <Card className="overflow-hidden border-blue-100 shadow-sm hover:shadow-md transition-all h-full">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-transparent border-b border-blue-100 pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
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
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-indigo-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-primary opacity-80" />
            </div>
            <p className="text-muted-foreground mb-4">You haven't had any conversations yet</p>
            <button 
              onClick={handleViewAllClick}
              className="bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors mx-auto"
            >
              <MessageSquare className="h-5 w-5" />
              Start a Conversation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.slice(0, 5).map((conversation) => (
              <div 
                key={conversation.id} 
                className="p-4 border border-blue-100 rounded-lg hover:bg-indigo-50/50 transition-colors cursor-pointer shadow-sm"
                onClick={() => handleChatClick(conversation.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <PaintBucket className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-sm">{conversation.title}</h3>
                        {conversation.pinned && (
                          <Pin className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {formatChatDate(conversation.timestamp)}
                  </span>
                </div>
                {conversation.pinned && (
                  <div className="mt-2">
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
