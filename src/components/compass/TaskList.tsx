
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompassPriority, CompassTask } from '@/types/compass';
import { format } from 'date-fns';
import { Check, Clock, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const getPriorityColor = (priority: CompassPriority) => {
    switch (priority) {
      case 'High': return 'bg-red-500 hover:bg-red-600';
      case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Prioritized Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="font-medium mb-1">{task.task_text}</p>
                    
                    {task.reasoning && (
                      <p className="text-sm text-muted-foreground italic mb-4">
                        {task.reasoning}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => onCompleteTask(task.id)}
                      >
                        <Check className="h-4 w-4" /> Complete
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => onSetReminder(task.id)}
                      >
                        <Clock className="h-4 w-4" /> Remind Me
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => onAddToCalendar(task.id)}
                      >
                        <CalendarDays className="h-4 w-4" /> Add to Calendar
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No tasks available. Create a plan to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
