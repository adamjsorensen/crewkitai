
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CompassPriority, CompassTask } from '@/types/compass';
import { format } from 'date-fns';
import { CheckCircle2, Clock, CalendarDays, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const getPriorityInfo = (priority: CompassPriority) => {
    switch (priority) {
      case 'High': 
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          hoverColor: 'hover:bg-red-50',
          icon: <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />,
          label: 'High Priority'
        };
      case 'Medium': 
        return { 
          color: 'bg-amber-100 text-amber-700 border-amber-200', 
          hoverColor: 'hover:bg-amber-50',
          icon: <Clock className="h-4 w-4 text-amber-500 mr-1.5" />,
          label: 'Medium Priority'
        };
      case 'Low': 
        return { 
          color: 'bg-green-100 text-green-700 border-green-200', 
          hoverColor: 'hover:bg-green-50',
          icon: null,
          label: 'Low Priority'
        };
      default: 
        return { 
          color: 'bg-slate-100 text-slate-700 border-slate-200', 
          hoverColor: 'hover:bg-slate-50',
          icon: null,
          label: 'Task'
        };
    }
  };
  
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Your Prioritized Tasks</CardTitle>
        {tasks.length > 0 && (
          <CardDescription>
            Focus on high priority tasks first to maximize your productivity
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              
              return (
                <li 
                  key={task.id} 
                  className={cn(
                    "border rounded-lg p-4 transition-all", 
                    priorityInfo.hoverColor
                  )}
                >
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("flex items-center gap-1 px-2 py-1 text-xs font-medium", priorityInfo.color)}
                        >
                          {priorityInfo.icon}
                          {priorityInfo.label}
                        </Badge>
                        
                        {task.due_date && (
                          <Badge variant="outline" className="flex items-center gap-1 bg-slate-100">
                            <CalendarDays className="h-3 w-3" />
                            {format(new Date(task.due_date), 'MMM d')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-base font-medium">{task.task_text}</p>
                    
                    {task.reasoning && (
                      <p className="text-sm text-muted-foreground">
                        {task.reasoning}
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                        onClick={() => onCompleteTask(task.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Complete
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
                        <CalendarDays className="h-4 w-4" /> Calendar
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-10 px-4">
            <div className="bg-primary/5 inline-flex rounded-full p-4 mb-4">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Enter your tasks in the form above and the AI will prioritize them for you,
              helping you focus on what matters most.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskList;
