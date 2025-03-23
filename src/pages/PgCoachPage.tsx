
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import PgChatInterface from '@/components/pg-coach/PgChatInterface';
import PgConversationList from '@/components/pg-coach/PgConversationList';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PgCoachPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [showConversations, setShowConversations] = useState(!isMobile);
  
  const {
    conversations,
    selectedConversationId,
    isNewChat,
    isLoading: isConversationsLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    togglePinConversation
  } = useConversations();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the PainterGrowth Coach",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isAuthLoading, navigate, toast]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  const ConversationListComponent = (
    <PgConversationList
      conversations={conversations}
      isLoading={isConversationsLoading}
      selectedConversationId={selectedConversationId}
      onSelectConversation={selectConversation}
      onDeleteConversation={deleteConversation}
      onNewConversation={createNewConversation}
      onTogglePinConversation={togglePinConversation}
    />
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden max-h-[calc(100vh-4rem)]">
        <div className="flex h-full">
          {/* Desktop sidebar */}
          {!isMobile && (
            <div className={`border-r ${showConversations ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
              {showConversations && ConversationListComponent}
            </div>
          )}
          
          {/* Main chat area */}
          <div className="flex-1 flex flex-col relative">
            {/* Toggle conversations button */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 left-3 z-10"
                onClick={() => setShowConversations(!showConversations)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}
            
            {/* Mobile conversations drawer */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-3 left-3 z-10"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-full sm:w-[400px]">
                  {ConversationListComponent}
                </SheetContent>
              </Sheet>
            )}
            
            <Card className={`overflow-hidden border-none shadow-md flex-1 ${isMobile ? '-mx-4 rounded-none' : ''}`}>
              <PgChatInterface 
                key={selectedConversationId || 'new'} 
                conversationId={selectedConversationId}
                onConversationStart={(id) => {
                  if (isNewChat && id) {
                    selectConversation(id);
                  }
                }}
              />
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PgCoachPage;
