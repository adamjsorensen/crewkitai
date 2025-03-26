
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CompassAnalyzeResponse } from '@/types/compass';
import { useLogActivity } from '@/hooks/useLogActivity';

type UseCompassPlanCreationProps = {
  onPlanCreated: (planId: string) => void;
  onTasksGenerated?: (response: CompassAnalyzeResponse) => void;
};

export const useCompassPlanCreation = ({ onPlanCreated, onTasksGenerated }: UseCompassPlanCreationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { logCompassAnalysis } = useLogActivity();

  const createPlan = async (input: string) => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some tasks, ideas, or reflections.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a plan.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create a new plan first
      const { data: planData, error: planError } = await supabase
        .from('compass_plans')
        .insert({ user_id: user.id })
        .select('id')
        .single();
        
      if (planError) {
        throw planError;
      }
      
      if (!planData?.id) {
        throw new Error("Failed to create plan");
      }
      
      console.log("Calling compass-analyze function with:", { 
        input_text: input, 
        plan_id: planData.id 
      });
      
      // Call the Compass analyze function
      const { data, error } = await supabase.functions.invoke('compass-analyze', {
        body: { 
          input_text: input,
          plan_id: planData.id
        }
      });
      
      if (error) {
        console.error("Function error:", error);
        throw error;
      }
      
      console.log("Function response:", data);
      
      // Log the compass analysis activity
      if (data && Array.isArray(data.tasks)) {
        await logCompassAnalysis(input, data.tasks, planData.id);
      }
      
      // Notify parent component that plan was created
      onPlanCreated(planData.id);
      
      // If onTasksGenerated is provided, call it with the response
      if (onTasksGenerated && data) {
        onTasksGenerated(data as CompassAnalyzeResponse);
      }
      
      toast({
        title: "Plan created!",
        description: "Your tasks have been prioritized and organized."
      });

      return true;
    } catch (err) {
      console.error('Error creating plan:', err);
      toast({
        title: "Error",
        description: "Failed to create your plan. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { createPlan, isProcessing };
};
