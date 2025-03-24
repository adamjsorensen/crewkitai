
import React from 'react';
import { CheckCircle2, Calendar, Tag, Pencil, Clock, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CompassTaskDisplay } from '@/types/compass';

interface TaskActionsProps {
  task: CompassTaskDisplay;
  onComplete: (task: CompassTaskDisplay) => void;
  onReminder: (task: CompassTaskDisplay) => void;
  onCalendar: (task: CompassTaskDisplay) => void;
  onCategory: (task: CompassTaskDisplay) => void;
  onTag: (task: CompassTaskDisplay) => void;
  onClarify?: (task: CompassTaskDisplay) => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({
  task,
  onComplete,
  onReminder,
  onCalendar,
  onCategory,
  onTag,
  onClarify
}) => {
  if (task.completed_at) {
    return null;
  }
  
  // Determine if this is a high priority task that needs attention
  const isHighPriority = task.priority === 'High';
  
  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`
                h-9 w-9 p-0 rounded-full
                ${isHighPriority 
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50 animate-pulse' 
                  : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
              `}
              onClick={() => onComplete(task)}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="sr-only">Mark Complete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mark Complete</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 w-9 p-0 rounded-full"
              onClick={() => onCalendar(task)}
            >
              <Calendar className="h-5 w-5" />
              <span className="sr-only">Add to Calendar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to Calendar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isHighPriority && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>High Priority Task</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-9 w-9 p-0 rounded-full"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>More Actions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => onReminder(task)} className="cursor-pointer">
            <Clock className="mr-2 h-4 w-4" />
            <span>Set Reminder</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onCategory(task)} className="cursor-pointer">
            <Tag className="mr-2 h-4 w-4" />
            <span>{task.category ? "Change Category" : "Add Category"}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onTag(task)} className="cursor-pointer">
            <Tag className="mr-2 h-4 w-4" />
            <span>{task.tags && task.tags.length > 0 ? "Manage Tags" : "Add Tags"}</span>
          </DropdownMenuItem>
          
          {task.clarification && !task.clarification.answer && onClarify && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onClarify(task)} className="text-amber-600 cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                <span>Clarify Task</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TaskActions;
