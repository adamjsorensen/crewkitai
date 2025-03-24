
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CompassInputProps {
  onPlanCreated: (planId: string) => void;
}

const CompassInput: React.FC<CompassInputProps> = ({ onPlanCreated }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      // Call the Compass analyze function
      const { data, error } = await supabase.functions.invoke('compass-analyze', {
        body: { 
          input_text: input,
          plan_id: planData.id
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Notify parent component that plan was created
      onPlanCreated(planData.id);
      
      toast({
        title: "Plan created!",
        description: "Your tasks have been prioritized and organized."
      });
    } catch (err) {
      console.error('Error creating plan:', err);
      toast({
        title: "Error",
        description: "Failed to create your plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Strategic Planner</CardTitle>
        <CardDescription>
          Enter your tasks, ideas, or reflections and we'll help you prioritize them.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Textarea
            placeholder="Finish the Jones project, call supplier about paint order, brainstorm marketing ideas for next month..."
            className="min-h-[150px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isProcessing || !input.trim()}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 
                Processing...
              </>
            ) : (
              <>
                Create Plan <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CompassInput;
