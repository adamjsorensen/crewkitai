
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePgConversations } from '@/hooks/usePgConversations';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import PgChatInterface from '@/components/pg-coach/PgChatInterface';
import PgConversationDialog from '@/components/pg-coach/PgConversationDialog';
import { useIsMobile } from '@/hooks/use-mobile';

const PgCoachPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showConversations, setShowConversations] = useState(false);
  
  const {
    conversations,
    selectedConversationId,
    isNewChat,
    isLoading: isConversationsLoading,
    selectConversation,
    createNewConversation,
    deleteConversation,
    togglePinConversation
  } = usePgConversations();

  // Handler for creating a new chat
  const handleNewChat = () => {
    console.log("[PgCoachPage] Creating new chat");
    createNewConversation();
  };

  // Handler for opening the conversation history
  const handleOpenHistory = () => {
    console.log("[PgCoachPage] Opening conversation history");
    setShowConversations(true);
  };

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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <Card className={`overflow-hidden border-none shadow-sm flex-1 h-full flex flex-col ${isMobile ? '-mx-3 rounded-none' : 'mx-0'}`}>
            <PgChatInterface 
              key={isNewChat ? 'new-chat' : selectedConversationId || 'new'} 
              conversationId={selectedConversationId}
              onConversationStart={(id) => {
                if (isNewChat && id) {
                  selectConversation(id);
                }
              }}
              onNewChat={handleNewChat}
              onOpenHistory={handleOpenHistory}
            />
          </Card>
        </div>
      </div>

      {/* Conversation History Dialog */}
      <PgConversationDialog
        open={showConversations}
        onOpenChange={setShowConversations}
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={handleNewChat}
        onTogglePinConversation={togglePinConversation}
      />
    </DashboardLayout>
  );
};

export default PgCoachPage;
