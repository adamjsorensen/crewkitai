
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { CompassTaskDisplay } from '@/types/compass';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface ClarificationDialogProps {
  task: CompassTaskDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ClarificationDialog: React.FC<ClarificationDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitClarification = async () => {
    if (!answer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide a clarification answer.",
        variant: "destructive",
      });
      return;
    }

    if (!task.clarification) {
      toast({
        title: "Error",
        description: "No clarification question found for this task.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('compass_clarifications')
        .update({ 
          answer: answer.trim(),
          answered_at: new Date().toISOString()
        })
        .eq('id', task.clarification.id);

      if (error) {
        console.error('Error submitting clarification:', error);
        toast({
          title: "Error",
          description: "Failed to submit clarification. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Clarification Submitted",
        description: "Your clarification has been recorded.",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error in clarification submission:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Clarify Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Task</h3>
            <p className="text-sm">{task.task_text}</p>
          </div>
          
          {task.clarification && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Question</h3>
              <p className="text-sm bg-amber-50 p-3 rounded-md border border-amber-200">{task.clarification.question}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your Answer</h3>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide clarification here..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmitClarification} 
            disabled={isSubmitting || !answer.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Clarification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClarificationDialog;
