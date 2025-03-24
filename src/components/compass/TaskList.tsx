import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, CheckCircle2, Clock, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CompassTaskDisplay } from '@/types/compass';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TaskListProps {
  tasks: CompassTaskDisplay[];
  onTaskUpdate: () => void;
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

const TaskList: React.FC<TaskListProps> = ({ tasks, onTaskUpdate }) => {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<CompassTaskDisplay | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isClarificationOpen, setIsClarificationOpen] = useState(false);
  const [reminderType, setReminderType] = useState<'15min' | '30min' | '1hr' | 'custom'>('15min');
  const [reminderMethod, setReminderMethod] = useState<'Email' | 'SMS'>('Email');
  const [customReminderTime, setCustomReminderTime] = useState<Date | undefined>(undefined);
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined);
  const [clarificationAnswer, setClarificationAnswer] = useState('');

  // Handle task completion
  const markTaskComplete = async (task: CompassTaskDisplay) => {
    try {
      const { error } = await supabase
        .from('compass_tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) {
        console.error('Error completing task:', error);
        toast({
          title: "Error",
          description: "Failed to mark task as complete. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Task Completed",
        description: "The task has been marked as complete.",
      });
      
      // Refresh tasks list
      onTaskUpdate();
    } catch (err) {
      console.error('Error in mark complete:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle set reminder
  const openReminderDialog = (task: CompassTaskDisplay) => {
    setSelectedTask(task);
    setIsReminderOpen(true);
    
    // Initialize with a default time (15 min from now)
    const defaultTime = new Date();
    defaultTime.setMinutes(defaultTime.getMinutes() + 15);
    setCustomReminderTime(defaultTime);
  };

  const setReminder = async () => {
    if (!selectedTask) return;
    
    try {
      let reminderTime = new Date();
      
      switch (reminderType) {
        case '15min':
          reminderTime.setMinutes(reminderTime.getMinutes() + 15);
          break;
        case '30min':
          reminderTime.setMinutes(reminderTime.getMinutes() + 30);
          break;
        case '1hr':
          reminderTime.setHours(reminderTime.getHours() + 1);
          break;
        case 'custom':
          if (customReminderTime) {
            reminderTime = customReminderTime;
          }
          break;
      }
      
      const { error } = await supabase
        .from('compass_reminders')
        .insert({
          task_id: selectedTask.id,
          method: reminderMethod,
          trigger_at: reminderTime.toISOString(),
        });

      if (error) {
        console.error('Error setting reminder:', error);
        toast({
          title: "Error",
          description: "Failed to set reminder. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Reminder Set",
        description: `You will be reminded on ${format(reminderTime, 'PPp')}`,
      });
      
      setIsReminderOpen(false);
    } catch (err) {
      console.error('Error in set reminder:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle calendar integration
  const openCalendarDialog = (task: CompassTaskDisplay) => {
    setSelectedTask(task);
    
    // Initialize with the task's due date if available
    if (task.due_date) {
      setCalendarDate(new Date(task.due_date));
    } else {
      setCalendarDate(new Date());
    }
    
    setIsCalendarOpen(true);
  };

  const generateCalendarFile = () => {
    if (!selectedTask || !calendarDate) return;
    
    // Simple iCalendar file generation
    const now = new Date();
    const startDate = format(calendarDate, "yyyyMMdd'T'HHmmss'Z'");
    const endDate = format(new Date(calendarDate.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss'Z'"); // 1 hour later
    const createdDate = format(now, "yyyyMMdd'T'HHmmss'Z'");
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PainterGrowth//Strategic Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${selectedTask.id}@paintergrowth.com`,
      `DTSTAMP:${createdDate}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${selectedTask.task_text}`,
      `DESCRIPTION:${selectedTask.reasoning || ''}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // Create a Blob and download link
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `task-${selectedTask.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Calendar File Generated",
      description: "Download has started. Import this file into your calendar application.",
    });
    
    setIsCalendarOpen(false);
  };

  // Handle clarification
  const openClarificationDialog = (task: CompassTaskDisplay) => {
    if (task.clarification) {
      setSelectedTask(task);
      setClarificationAnswer(task.clarification.answer || '');
      setIsClarificationOpen(true);
    }
  };

  const submitClarification = async () => {
    if (!selectedTask || !selectedTask.clarification) return;
    
    try {
      const { error } = await supabase
        .from('compass_clarifications')
        .update({ answer: clarificationAnswer })
        .eq('id', selectedTask.clarification.id);

      if (error) {
        console.error('Error submitting clarification:', error);
        toast({
          title: "Error",
          description: "Failed to submit clarification. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Clarification Submitted",
        description: "Your response has been recorded.",
      });
      
      setIsClarificationOpen(false);
      onTaskUpdate();
    } catch (err) {
      console.error('Error in submit clarification:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If no tasks, show a message
  if (tasks.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No tasks available. Create a new plan to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            className={cn(
              "w-full transition-all duration-300",
              task.completed_at ? "bg-green-50" : ""
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    {task.clarification && !task.clarification.answer && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700">
                        Needs Clarification
                      </Badge>
                    )}
                    {task.due_date && (
                      <div className="text-xs text-muted-foreground flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  
                  <h3 className={cn(
                    "text-lg font-medium mb-1",
                    task.completed_at ? "line-through text-muted-foreground" : ""
                  )}>
                    {task.task_text}
                  </h3>
                  
                  {task.reasoning && (
                    <p className="text-sm text-muted-foreground italic mb-3">
                      {task.reasoning}
                    </p>
                  )}
                  
                  {task.clarification && !task.clarification.answer && (
                    <div 
                      className="text-sm p-2 bg-amber-50 border border-amber-200 rounded-md cursor-pointer mt-2"
                      onClick={() => openClarificationDialog(task)}
                    >
                      <span className="font-medium text-amber-800">Clarification needed:</span> {task.clarification.question}
                    </div>
                  )}
                </div>
                
                {!task.completed_at && (
                  <div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => markTaskComplete(task)}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            
            {!task.completed_at && (
              <CardFooter className="flex justify-start gap-2 p-4 pt-0 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => openReminderDialog(task)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Remind Me
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => openCalendarDialog(task)}
                >
                  <CalendarPlus className="h-3 w-3 mr-1" />
                  Add to Calendar
                </Button>
                
                {task.clarification && !task.clarification.answer && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs text-amber-600 border-amber-300"
                    onClick={() => openClarificationDialog(task)}
                  >
                    Clarify
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      {/* Reminder Dialog */}
      <Dialog open={isReminderOpen} onOpenChange={setIsReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a Reminder</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">When should we remind you?</h4>
                <RadioGroup 
                  value={reminderType} 
                  onValueChange={(value) => setReminderType(value as any)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15min" id="r1" />
                    <Label htmlFor="r1">15 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30min" id="r2" />
                    <Label htmlFor="r2">30 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1hr" id="r3" />
                    <Label htmlFor="r3">1 hour</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="r4" />
                    <Label htmlFor="r4">Custom time</Label>
                  </div>
                </RadioGroup>
                
                {reminderType === 'custom' && (
                  <div className="mt-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {customReminderTime ? format(customReminderTime, 'PPp') : "Pick a date and time"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={customReminderTime}
                          onSelect={(date) => {
                            if (date) {
                              const newDate = new Date(date);
                              // Keep the time part from the existing customReminderTime
                              if (customReminderTime) {
                                newDate.setHours(customReminderTime.getHours());
                                newDate.setMinutes(customReminderTime.getMinutes());
                              }
                              setCustomReminderTime(newDate);
                            }
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Label>Time</Label>
                          <div className="flex mt-2">
                            <Input
                              type="time"
                              value={customReminderTime ? format(customReminderTime, 'HH:mm') : ''}
                              onChange={(e) => {
                                if (e.target.value && customReminderTime) {
                                  const [hours, minutes] = e.target.value.split(':').map(Number);
                                  const newDate = new Date(customReminderTime);
                                  newDate.setHours(hours);
                                  newDate.setMinutes(minutes);
                                  setCustomReminderTime(newDate);
                                }
                              }}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">How should we remind you?</h4>
                <RadioGroup 
                  value={reminderMethod} 
                  onValueChange={(value) => setReminderMethod(value as 'Email' | 'SMS')}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Email" id="m1" />
                    <Label htmlFor="m1">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SMS" id="m2" />
                    <Label htmlFor="m2">SMS (text message)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderOpen(false)}>Cancel</Button>
            <Button onClick={setReminder}>Set Reminder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Calendar</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">When is this task due?</h4>
                <div className="border rounded-md p-4">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={setCalendarDate}
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalendarOpen(false)}>Cancel</Button>
            <Button onClick={generateCalendarFile}>Generate Calendar File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clarification Dialog */}
      <Dialog open={isClarificationOpen} onOpenChange={setIsClarificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Clarification</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              {selectedTask?.clarification && (
                <>
                  <div>
                    <h4 className="text-sm font-medium">Task:</h4>
                    <p className="mt-1">{selectedTask.task_text}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Question:</h4>
                    <p className="mt-1">{selectedTask.clarification.question}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Your Answer:</h4>
                    <Textarea
                      value={clarificationAnswer}
                      onChange={(e) => setClarificationAnswer(e.target.value)}
                      placeholder="Provide more details about this task..."
                      className="min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClarificationOpen(false)}>Cancel</Button>
            <Button onClick={submitClarification} disabled={!clarificationAnswer.trim()}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskList;
