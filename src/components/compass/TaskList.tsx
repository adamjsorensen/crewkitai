
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompassTask } from '@/types/compass';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface TaskListProps {
  tasks: CompassTask[];
  onCompleteTask: (taskId: string) => void;
  onSetReminder: (taskId: string) => void;
  onAddToCalendar: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onCompleteTask,
  onSetReminder,
  onAddToCalendar
}) => {
  if (tasks.length === 0) {
    return (
      <Card className="w-full border border-dashed compass-task-list">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 rounded-full bg-primary/10 p-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No tasks yet</h3>
          <p className="max-w-md text-muted-foreground mb-6">
            Enter your tasks in the form above and our AI will prioritize them for you.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: CompassTask['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'Low':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Card className="w-full compass-task-list">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Your Prioritized Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li 
              key={task.id} 
              className="border rounded-lg p-4 compass-task-item"
            >
              <div className="flex flex-col space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className={`${getPriorityColor(task.priority)}`}>
                        {task.priority} Priority
                      </Badge>
                      
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-base font-medium">{task.task_text}</p>
                    
                    {task.reasoning && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        {task.reasoning}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onSetReminder(task.id)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Remind Me
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAddToCalendar(task.id)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                  
                  <Button 
                    onClick={() => onCompleteTask(task.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white compass-complete-button"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TaskList;
