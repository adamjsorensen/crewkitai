
import React, { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompassTaskDisplay } from '@/types/compass';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CompletedTasksListProps {
  tasks: CompassTaskDisplay[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({ tasks }) => {
  const [isOpen, setIsOpen] = useState(false);

  // If no completed tasks, don't show anything
  if (tasks.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full mt-6"
    >
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Completed Tasks</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-start p-3 border-t border-border"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Completed: {task.completed_at ? format(new Date(task.completed_at), 'MMM d, yyyy h:mm a') : 'Unknown'}
                    </span>
                  </div>
                  
                  <h3 className="text-md font-medium line-through text-muted-foreground">
                    {task.task_text}
                  </h3>
                  
                  {task.reasoning && (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      {task.reasoning}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CompletedTasksList;
