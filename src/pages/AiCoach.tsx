
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/ai-coach/ChatInterface';
import { PaperPlaneIcon, Sparkles } from 'lucide-react';

const AiCoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold">AI Coach</h1>
            <p className="text-muted-foreground">Get expert advice for your painting business</p>
          </div>
        </div>
        
        <Card className="p-0 overflow-hidden border-none shadow-md">
          <ChatInterface />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AiCoach;
