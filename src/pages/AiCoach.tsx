
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import ChatInterface from '@/components/ai-coach/ChatInterface';
import ConversationDialog from '@/components/ai-coach/ConversationDialog';
import ConversationDrawer from '@/components/ai-coach/ConversationDrawer';
import { Button } from '@/components/ui/button';
import { PlusCircle, HistoryIcon } from 'lucide-react';

const AiCoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    conversations,
    selectedConversationId,
    isNewChat, // Use the new isNewChat state
    isLoading,
    createNewConversation,
    selectConversation,
    deleteConversation,
    togglePinConversation
  } = useConversations();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the AI Coach feature",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, navigate, toast]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleNewConversation = () => {
    createNewConversation();
    // Don't close dialog here, let user explicitly close it
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold">AI Coach</h1>
            <p className="text-muted-foreground">Get expert advice for your painting business</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={createNewConversation}
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
            
            <ConversationDrawer onClick={handleOpenDialog} />
          </div>
        </div>
        
        <Card className="p-0 overflow-hidden border-none shadow-md flex-1">
          <div className="flex flex-col h-[75vh]">
            <div className="flex-1">
              <ChatInterface 
                conversationId={selectedConversationId}
                isNewChat={isNewChat} // Pass isNewChat state to ChatInterface
                onConversationCreated={(id) => {
                  if (id) {
                    selectConversation(id);
                  }
                }}
              />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Conversation History Dialog */}
      <ConversationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={selectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        onPinConversation={togglePinConversation}
      />
    </DashboardLayout>
  );
};

export default AiCoach;
