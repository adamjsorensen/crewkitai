
import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompassTask } from '@/types/compass';

interface TaskClarificationDialogProps {
  task: CompassTask;
  onClarificationUpdate: () => void;
}

const TaskClarificationDialog = ({ task, onClarificationUpdate }: TaskClarificationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        title: "Please provide clarification",
        description: "The clarification cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if a clarification record already exists
      const { data: existingClarification, error: fetchError } = await supabase
        .from('compass_clarifications')
        .select('*')
        .eq('task_id', task.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If clarification exists, update it; otherwise create a new one
      let result;
      if (existingClarification) {
        result = await supabase
          .from('compass_clarifications')
          .update({ 
            answer,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingClarification.id);
      } else {
        result = await supabase
          .from('compass_clarifications')
          .insert({
            task_id: task.id,
            question: 'Please clarify this task',
            answer,
          });
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Clarification added",
        description: "Your clarification has been saved.",
      });
      
      onClarificationUpdate();
      setOpen(false);
    } catch (error) {
      console.error('Error saving clarification:', error);
      toast({
        title: "Failed to save clarification",
        description: "There was a problem saving your clarification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center w-full">
          <Edit className="h-4 w-4 mr-2" />
          <span>Add clarification</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Task Clarification</DialogTitle>
          <DialogDescription>
            Add more details or clarification for this task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-text">Task</Label>
            <p id="task-text" className="text-sm font-medium">{task.task_text}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clarification">Clarification</Label>
            <Textarea
              id="clarification"
              placeholder="Add details or context for this task..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Clarification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskClarificationDialog;
