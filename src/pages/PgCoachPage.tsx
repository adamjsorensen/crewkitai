
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import PgChatInterface from '@/components/pg-coach/PgChatInterface';
import { useIsMobile } from '@/hooks/use-mobile';

const PgCoachPage = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the PainterGrowth Coach",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden max-h-[calc(100vh-4rem)]">
        <Card className={`p-0 overflow-hidden border-none shadow-md flex-1 ${isMobile ? '-mx-4 rounded-none' : ''}`}>
          <PgChatInterface />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PgCoachPage;
