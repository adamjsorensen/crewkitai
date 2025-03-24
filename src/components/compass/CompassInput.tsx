
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CompassAnalyzeResponse } from '@/types/compass';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompassInputProps {
  onTasksGenerated: (response: CompassAnalyzeResponse) => void;
}

const CompassInput: React.FC<CompassInputProps> = ({ onTasksGenerated }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some tasks, ideas, or reflections.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use this feature.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Call the compass-analyze edge function
      const response = await supabase.functions.invoke('compass-analyze', {
        body: {
          input,
          user_id: session.user.id
        },
      });
      
      if (response.error) {
        console.error('Error analyzing tasks:', response.error);
        toast({
          title: "Error",
          description: "Failed to analyze your input. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Call the callback with the response data
      onTasksGenerated(response.data as CompassAnalyzeResponse);
      
      // Clear the input field after successful submission
      setInput('');
      
    } catch (error) {
      console.error('Error processing input:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Strategic Planner</CardTitle>
        <CardDescription>
          Enter your tasks, ideas, or reflections. We'll organize and prioritize them for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your tasks, ideas, or reflections..."
          className="min-h-[150px] mb-4"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit} 
          className="w-full" 
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Create Plan'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompassInput;
