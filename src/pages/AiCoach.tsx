
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import ChatInterface from '@/components/ai-coach/ChatInterface';
import ConversationList from '@/components/ai-coach/ConversationList';
import ConversationDrawer from '@/components/ai-coach/ConversationDrawer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useMediaQuery } from '@/hooks/use-mobile';

const MIN_CONVERSATION_PANEL_SIZE = 15;
const DEFAULT_CONVERSATION_PANEL_SIZE = 25;

const AiCoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  
  const [collapsedConversationPanel, setCollapsedConversationPanel] = useState(!isDesktop);
  
  const {
    conversations,
    selectedConversationId,
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

  const handlePanelResize = (size: number) => {
    setCollapsedConversationPanel(size <= MIN_CONVERSATION_PANEL_SIZE);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold">AI Coach</h1>
            <p className="text-muted-foreground">Get expert advice for your painting business</p>
          </div>
          
          {isTablet && !isDesktop && (
            <ConversationDrawer 
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={selectConversation}
              onNewConversation={createNewConversation}
              onDeleteConversation={deleteConversation}
              onPinConversation={togglePinConversation}
            />
          )}
        </div>
        
        <Card className="p-0 overflow-hidden border-none shadow-md flex-1">
          {isDesktop || isTablet ? (
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[75vh]"
            >
              <ResizablePanel 
                defaultSize={DEFAULT_CONVERSATION_PANEL_SIZE} 
                minSize={MIN_CONVERSATION_PANEL_SIZE}
                maxSize={40}
                collapsible={true}
                collapsedSize={3.5}
                onResize={handlePanelResize}
                className={`border-r ${collapsedConversationPanel ? 'min-w-[50px]' : 'min-w-[250px]'}`}
              >
                {!collapsedConversationPanel && (
                  <ConversationList 
                    conversations={conversations}
                    selectedConversationId={selectedConversationId}
                    onSelectConversation={selectConversation}
                    onNewConversation={createNewConversation}
                    onDeleteConversation={deleteConversation}
                    onPinConversation={togglePinConversation}
                  />
                )}
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={100 - DEFAULT_CONVERSATION_PANEL_SIZE}>
                <ChatInterface 
                  conversationId={selectedConversationId} 
                  onConversationCreated={(id) => {
                    // When a new conversation is created we should update the selected conversation
                    if (id && !selectedConversationId) {
                      selectConversation(id);
                    }
                  }}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            // Mobile view
            <div className="flex flex-col h-[75vh]">
              <div className="flex justify-between items-center p-3 border-b">
                <h2 className="text-lg font-medium">AI Coach</h2>
                <ConversationDrawer 
                  conversations={conversations}
                  selectedConversationId={selectedConversationId}
                  onSelectConversation={selectConversation}
                  onNewConversation={createNewConversation}
                  onDeleteConversation={deleteConversation}
                  onPinConversation={togglePinConversation}
                />
              </div>
              <div className="flex-1">
                <ChatInterface 
                  conversationId={selectedConversationId}
                  onConversationCreated={(id) => {
                    if (id && !selectedConversationId) {
                      selectConversation(id);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
