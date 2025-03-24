
import React from 'react';
import { CompassTaskDisplay } from '@/types/compass';
import { useFilteredTasks } from '@/hooks/useFilteredTasks';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import TaskActions from './TaskActions';
import CategoryBadge from './CategoryBadge';
import TagBadge from './TagBadge';

interface ListViewProps {
  tasks: CompassTaskDisplay[];
  onTaskUpdate: () => void;
  onComplete: (task: CompassTaskDisplay) => void;
  onReminder: (task: CompassTaskDisplay) => void;
  onCalendar: (task: CompassTaskDisplay) => void;
  onCategory: (task: CompassTaskDisplay) => void;
  onTag: (task: CompassTaskDisplay) => void;
  onClarify: (task: CompassTaskDisplay) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-500';
    case 'Medium':
      return 'bg-amber-500';
    case 'Low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const ListView: React.FC<ListViewProps> = ({
  tasks,
  onTaskUpdate,
  onComplete,
  onReminder,
  onCalendar,
  onCategory,
  onTag,
  onClarify
}) => {
  // Apply filters
  const filteredTasks = useFilteredTasks(tasks);

  // If no tasks, show a message
  if (filteredTasks.length === 0) {
    return (
      <Card className="w-full">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">No tasks available. Create a new plan to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <Card 
          key={task.id} 
          className={cn(
            "w-full transition-all duration-300 overflow-hidden",
            task.completed_at ? "bg-gray-50" : ""
          )}
        >
          <div className="flex">
            {/* Priority indicator as left border */}
            <div className={cn("w-1.5", getPriorityColor(task.priority))} />
            
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Status badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-accent text-accent-foreground">{task.priority}</Badge>
                    
                    {task.category && (
                      <CategoryBadge 
                        name={task.category.name} 
                        color={task.category.color} 
                        onClick={() => onCategory(task)}
                      />
                    )}
                    
                    {task.due_date && (
                      <div className="text-xs text-muted-foreground flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    
                    {task.clarification && !task.clarification.answer && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Needs Clarification
                      </Badge>
                    )}
                  </div>
                  
                  {/* Task title */}
                  <h3 className={cn(
                    "text-lg font-medium mb-1 break-words",
                    task.completed_at ? "line-through text-muted-foreground" : ""
                  )}>
                    {task.task_text}
                  </h3>
                  
                  {/* Task reasoning */}
                  {task.reasoning && (
                    <p className="text-sm text-muted-foreground italic mb-3 break-words">
                      {task.reasoning}
                    </p>
                  )}
                  
                  {/* Task tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.tags.map(tag => (
                        <TagBadge 
                          key={tag.id}
                          name={tag.name} 
                          color={tag.color}
                          onClick={() => onTag(task)}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Clarification callout */}
                  {task.clarification && !task.clarification.answer && (
                    <div 
                      className="text-sm p-2 bg-amber-50 border border-amber-200 rounded-md cursor-pointer mt-2"
                      onClick={() => onClarify(task)}
                    >
                      <span className="font-medium text-amber-800">Clarification needed:</span> {task.clarification.question}
                    </div>
                  )}
                </div>
                
                {/* Task actions */}
                <TaskActions 
                  task={task}
                  onComplete={onComplete}
                  onReminder={onReminder}
                  onCalendar={onCalendar}
                  onCategory={onCategory}
                  onTag={onTag}
                  onClarify={task.clarification && !task.clarification.answer ? onClarify : undefined}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ListView;
