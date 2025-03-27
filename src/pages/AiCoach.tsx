
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// This component now simply redirects to the PG Coach page 
// with a notification to the user about the change

const AiCoach = () => {
  const { toast } = useToast();
  
  useEffect(() => {
    toast({
      title: "Redirecting to PainterGrowth AI",
      description: "We've upgraded our AI assistant to provide you with better guidance.",
      duration: 5000,
    });
  }, [toast]);

  return <Navigate to="/dashboard/pg-coach" replace />;
};

export default AiCoach;
