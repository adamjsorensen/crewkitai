
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useConversations } from '@/hooks/useConversations';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import PgChatInterface from '@/components/pg-coach/PgChatInterface';
import { useIsMobile } from '@/hooks/use-mobile';

const PgCoachPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const {
    selectedConversationId,
    isNewChat,
    selectConversation,
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
    </DashboardLayout>
  );
};

export default PgCoachPage;
