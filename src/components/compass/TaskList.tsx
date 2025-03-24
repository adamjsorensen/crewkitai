
import React, { useState } from 'react';
import { Check, Loader2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompassTaskDisplay } from '@/types/compass';
import TaskClarificationDialog from './TaskClarificationDialog';
import TaskReminderDialog from './TaskReminderDialog';

interface TaskListProps {
  tasks: CompassTaskDisplay[];
  onTaskUpdate: () => void;
}

const TaskList = ({ tasks, onTaskUpdate }: TaskListProps) => {
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  const handleComplete = async (task: CompassTaskDisplay) => {
    setIsCompleting(task.id);
    try {
      const { data, error } = await supabase
        .from('compass_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Task completed",
        description: `You completed task "${task.task_text}"`,
      });
      
      onTaskUpdate();
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Couldn't complete task",
        description: "There was a problem completing your task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(null);
    }
  };
  
  const renderTaskActions = (task: CompassTaskDisplay) => {
    return (
      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => handleComplete(task)}
          disabled={!!isCompleting}
        >
          {isCompleting === task.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Complete
        </Button>
        
        <TaskReminderDialog task={task} onReminderSet={onTaskUpdate} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <TaskClarificationDialog task={task} onClarificationUpdate={onTaskUpdate} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };
  
  return (
    <>
      {tasks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <CardTitle>{task.task_text}</CardTitle>
                {task.category && (
                  <div className="mt-2">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                      style={{ backgroundColor: `${task.category.color}20`, color: task.category.color, borderColor: task.category.color }}
                    >
                      {task.category.name}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Priority: {task.priority}
                  {task.due_date && (
                    <div className="mt-2">
                      Due Date: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </CardDescription>
                {task.reasoning && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground italic">
                      {task.reasoning}
                    </p>
                  </div>
                )}
                {task.clarification && task.clarification.answer && (
                  <div className="mt-4">
                    <p className="text-sm">
                      <span className="font-semibold">Clarification:</span> {task.clarification.answer}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {renderTaskActions(task)}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <CardDescription>
              No tasks yet. Generate some tasks to get started!
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default TaskList;
