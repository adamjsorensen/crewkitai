
import React, { useState, useEffect } from 'react';
import { CompassTaskDisplay } from '@/types/compass';
import { useTaskView } from '@/contexts/TaskViewContext';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import TaskActions from './TaskActions';
import CategoryBadge from './CategoryBadge';
import TagBadge from './TagBadge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface KanbanViewProps {
  tasks: CompassTaskDisplay[];
  onTaskUpdate: () => void;
  onComplete: (task: CompassTaskDisplay) => void;
  onReminder: (task: CompassTaskDisplay) => void;
  onCalendar: (task: CompassTaskDisplay) => void;
  onCategory: (task: CompassTaskDisplay) => void;
  onTag: (task: CompassTaskDisplay) => void;
  onClarify: (task: CompassTaskDisplay) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onTaskUpdate,
  onComplete,
  onReminder,
  onCalendar,
  onCategory,
  onTag,
  onClarify
}) => {
  const { filters } = useTaskView();
  
  // Group tasks by priority
  const highPriorityTasks = tasks.filter(task => task.priority === 'High');
  const mediumPriorityTasks = tasks.filter(task => task.priority === 'Medium');
  const lowPriorityTasks = tasks.filter(task => task.priority === 'Low');

  // Apply filters
  const [filteredTasks, setFilteredTasks] = useState<{
    high: CompassTaskDisplay[];
    medium: CompassTaskDisplay[];
    low: CompassTaskDisplay[];
  }>({
    high: highPriorityTasks,
    medium: mediumPriorityTasks,
    low: lowPriorityTasks
  });

  // Apply filters when tasks or filters change
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply priority filters
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(task => filters.priority?.includes(task.priority));
    }
    
    // Apply category filters
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter(task => task.category && filters.category?.includes(task.category.id));
    }
    
    // Apply tag filters
    if (filters.tag && filters.tag.length > 0) {
      filtered = filtered.filter(task => 
        task.tags && task.tags.some(tag => filters.tag?.includes(tag.id))
      );
    }
    
    // Apply due date filters
    if (filters.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
      
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        if (filters.dueDate === 'today') {
          return dueDate.getTime() === today.getTime();
        } else if (filters.dueDate === 'week') {
          return dueDate >= today && dueDate <= endOfWeek;
        } else if (filters.dueDate === 'month') {
          return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
        } else if (filters.dueDate === 'overdue') {
          return dueDate < today;
        }
        return false;
      });
    }
    
    // Update filtered tasks
    setFilteredTasks({
      high: filtered.filter(task => task.priority === 'High'),
      medium: filtered.filter(task => task.priority === 'Medium'),
      low: filtered.filter(task => task.priority === 'Low')
    });
  }, [tasks, filters]);

  const renderTaskCard = (task: CompassTaskDisplay) => {
    return (
      <Card 
        key={task.id} 
        className="mb-2 overflow-hidden"
      >
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Task title */}
              <h3 className="text-md font-medium mb-1 break-words">
                {task.task_text}
              </h3>
              
              {/* Category & Due date */}
              <div className="flex flex-wrap items-center gap-1 mb-1">
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
                    {format(new Date(task.due_date), 'MMM d')}
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
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
                  className="text-xs p-1 bg-amber-50 border border-amber-200 rounded-md cursor-pointer mt-1"
                  onClick={() => onClarify(task)}
                >
                  <span className="font-medium text-amber-800">?</span> Needs clarification
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
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* High Priority Column */}
      <div className="bg-gray-50 rounded-md p-2">
        <div className="flex items-center px-2 py-1 mb-2">
          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
          <h3 className="font-medium">High Priority</h3>
          <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">
            {filteredTasks.high.length}
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="px-1 py-1">
            {filteredTasks.high.length > 0 ? (
              filteredTasks.high.map(renderTaskCard)
            ) : (
              <div className="text-center p-4 text-sm text-muted-foreground">
                No high priority tasks
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Medium Priority Column */}
      <div className="bg-gray-50 rounded-md p-2">
        <div className="flex items-center px-2 py-1 mb-2">
          <div className="h-3 w-3 rounded-full bg-amber-500 mr-2"></div>
          <h3 className="font-medium">Medium Priority</h3>
          <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">
            {filteredTasks.medium.length}
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="px-1 py-1">
            {filteredTasks.medium.length > 0 ? (
              filteredTasks.medium.map(renderTaskCard)
            ) : (
              <div className="text-center p-4 text-sm text-muted-foreground">
                No medium priority tasks
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Low Priority Column */}
      <div className="bg-gray-50 rounded-md p-2">
        <div className="flex items-center px-2 py-1 mb-2">
          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
          <h3 className="font-medium">Low Priority</h3>
          <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5">
            {filteredTasks.low.length}
          </span>
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="px-1 py-1">
            {filteredTasks.low.length > 0 ? (
              filteredTasks.low.map(renderTaskCard)
            ) : (
              <div className="text-center p-4 text-sm text-muted-foreground">
                No low priority tasks
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default KanbanView;
