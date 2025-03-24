
import React, { useState, useEffect } from 'react';
import { CompassTaskDisplay } from '@/types/compass';
import { useTaskView } from '@/contexts/TaskViewContext';
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TaskActions from './TaskActions';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import CategoryBadge from './CategoryBadge';

interface CalendarViewProps {
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
      return 'bg-red-500 border-red-600';
    case 'Medium':
      return 'bg-amber-400 border-amber-500';
    case 'Low':
      return 'bg-green-500 border-green-600';
    default:
      return 'bg-gray-500 border-gray-600';
  }
};

const CalendarView: React.FC<CalendarViewProps> = ({
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
  
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
  
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date());
  
  // Apply filters to tasks
  const [filteredTasks, setFilteredTasks] = useState<CompassTaskDisplay[]>([]);

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
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(todayDate);
      endOfWeek.setDate(todayDate.getDate() + (7 - todayDate.getDay()));
      
      const endOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
      
      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        if (filters.dueDate === 'today') {
          return dueDate.getTime() === todayDate.getTime();
        } else if (filters.dueDate === 'week') {
          return dueDate >= todayDate && dueDate <= endOfWeek;
        } else if (filters.dueDate === 'month') {
          return dueDate.getMonth() === todayDate.getMonth() && dueDate.getFullYear() === todayDate.getFullYear();
        } else if (filters.dueDate === 'overdue') {
          return dueDate < todayDate;
        }
        return false;
      });
    }
    
    // Filter out tasks without due dates
    filtered = filtered.filter(task => !!task.due_date);
    
    setFilteredTasks(filtered);
  }, [tasks, filters]);

  // Calendar navigation
  const previousMonth = () => {
    const firstDayPreviousMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayPreviousMonth, 'MMM-yyyy'));
  };

  const nextMonth = () => {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  };

  // Calendar days
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  // Tasks for the selected day
  const tasksForSelectedDay = filteredTasks.filter(
    task => task.due_date && isSameDay(new Date(task.due_date), selectedDay)
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">
          {format(firstDayCurrentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedDay(today);
              setCurrentMonth(format(today, 'MMM-yyyy'));
            }}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={i} className="text-center font-medium py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 auto-rows-fr mb-4">
        {days.map((day, dayIdx) => {
          // Tasks for this day
          const tasksForDay = filteredTasks.filter(
            task => task.due_date && isSameDay(new Date(task.due_date), day)
          );
          
          return (
            <div
              key={dayIdx}
              className={cn(
                "min-h-[80px] p-1 border border-border hover:bg-accent/50 cursor-pointer relative",
                !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground bg-muted/30",
                isEqual(day, selectedDay) && "bg-accent",
                isToday(day) && "border-primary"
              )}
              onClick={() => setSelectedDay(day)}
            >
              {/* Day number */}
              <div className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full text-xs",
                isToday(day) && "bg-primary text-primary-foreground font-medium"
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Tasks for the day - limited preview */}
              <div className="space-y-1 mt-1 max-h-[60px] overflow-hidden">
                {tasksForDay.slice(0, 3).map((task) => (
                  <TooltipProvider key={task.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "text-xs p-0.5 truncate border-l-2 pl-1",
                            getPriorityColor(task.priority)
                          )}
                        >
                          {task.task_text}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{task.task_text}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {tasksForDay.length > 3 && (
                  <div className="text-xs text-center text-muted-foreground">
                    +{tasksForDay.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tasks for selected day */}
      <div className="border-t border-border pt-4">
        <h3 className="font-medium mb-2">
          {format(selectedDay, 'EEEE, MMMM d')}
          {" - "}
          {tasksForSelectedDay.length} tasks
        </h3>
        
        <div className="space-y-2">
          {tasksForSelectedDay.length === 0 ? (
            <Card className="p-3 text-center text-muted-foreground text-sm">
              No tasks due on this day
            </Card>
          ) : (
            tasksForSelectedDay.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <div className="flex">
                  {/* Priority indicator */}
                  <div className={cn("w-1.5", getPriorityColor(task.priority))}></div>
                  
                  <div className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Task title */}
                        <h3 className="text-md font-medium mb-1">
                          {task.task_text}
                        </h3>
                        
                        {/* Category badge */}
                        {task.category && (
                          <div className="mb-1">
                            <CategoryBadge 
                              name={task.category.name} 
                              color={task.category.color} 
                              onClick={() => onCategory(task)}
                            />
                          </div>
                        )}
                        
                        {/* Reasoning */}
                        {task.reasoning && (
                          <p className="text-sm text-muted-foreground italic">{task.reasoning}</p>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
