
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import ChatInterface from '@/components/ai-coach/ChatInterface';
import ConversationDialog from '@/components/ai-coach/ConversationDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, HistoryIcon, PaintBucket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const AiCoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    conversations,
    selectedConversationId,
    isNewChat,
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
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <PaintBucket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">AI Coach</h1>
              <p className="text-muted-foreground">Get expert advice for your painting business</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1.5 bg-primary/90 hover:bg-primary"
              onClick={createNewConversation}
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Chat</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
              onClick={handleOpenDialog}
            >
              <HistoryIcon className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-0 overflow-hidden border-none shadow-md flex-1 bg-card/50">
          <div className="flex flex-col h-[85vh]">
            <div className="flex-1">
              <ChatInterface 
                conversationId={selectedConversationId}
                isNewChat={isNewChat}
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
