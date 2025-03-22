
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import ChatInterface from '@/components/ai-coach/ChatInterface';
import ConversationDialog from '@/components/ai-coach/ConversationDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, HistoryIcon, PaintBucket, Brain } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

const AiCoach = () => {
  console.log("[AiCoach] Component rendered");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  
  useEffect(() => {
    console.log("[AiCoach] isMobile state:", isMobile);
  }, [isMobile]);
  
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
    console.log("[AiCoach] Selected conversation ID:", selectedConversationId);
    console.log("[AiCoach] Is new chat:", isNewChat);
  }, [selectedConversationId, isNewChat]);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the AI Coach feature",
        variant: "destructive",
      });
      navigate("/auth");
    }
    
    // Prevent body scrolling on mobile to fix the chat interface to bottom
    if (isMobile) {
      console.log("[AiCoach] Applying body overflow: hidden for mobile");
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Restore body scrolling when component unmounts
      console.log("[AiCoach] Restoring body overflow on unmount");
      document.body.style.overflow = '';
    };
  }, [user, navigate, toast, isMobile]);

  const handleOpenDialog = () => {
    console.log("[AiCoach] Opening conversation dialog");
    setDialogOpen(true);
  };

  const handleNewConversation = () => {
    console.log("[AiCoach] Creating new conversation");
    createNewConversation();
  };
  
  const handleBackToWelcome = () => {
    console.log("[AiCoach] Navigating back to welcome screen");
    // Use createNewConversation to reset the state and show the welcome screen
    createNewConversation();
  };

  const showWelcomeHeader = isNewChat && !selectedConversationId;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden max-h-[calc(100vh-4rem)]" style={{ height: 'calc(100vh - 4rem)' }}>
        
        {/* Mobile header and separator removed */}
        
        <Card className={`p-0 overflow-hidden border-none shadow-md flex-1 ${isMobile ? '-mx-4 rounded-none' : ''}`}>
          <div className="flex flex-col h-full max-h-full">
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={
                <div className="p-4">
                  <Skeleton className="h-24 w-full mb-4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              }>
                <ChatInterface 
                  conversationId={selectedConversationId}
                  isNewChat={isNewChat}
                  onConversationCreated={(id) => {
                    console.log("[AiCoach] Conversation created with ID:", id);
                    if (id) {
                      selectConversation(id);
                    }
                  }}
                  onNewChat={createNewConversation}
                  onHistoryClick={handleOpenDialog}
                  onBackToWelcome={handleBackToWelcome}
                />
              </Suspense>
            </div>
          </div>
        </Card>

        {/* Mobile New Chat Floating Button */}
        {isMobile && (
          <Button
            onClick={createNewConversation}
            className="fixed bottom-20 right-4 shadow-lg z-20 rounded-full h-12 w-12 p-0 bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      {/* Conversation History Dialog */}
      <ConversationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          console.log("[AiCoach] Dialog open state changing to:", open);
          setDialogOpen(open);
        }}
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={(id) => {
          console.log("[AiCoach] Selecting conversation:", id);
          selectConversation(id);
        }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={(id) => {
          console.log("[AiCoach] Deleting conversation:", id);
          deleteConversation(id);
        }}
        onPinConversation={(id) => {
          console.log("[AiCoach] Toggling pin for conversation:", id);
          // Fix: Pass the correct arguments to togglePinConversation
          // We need to determine the current state and toggle it
          const conversation = conversations.find(c => c.id === id);
          if (conversation) {
            togglePinConversation(id, !conversation.pinned);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default AiCoach;
