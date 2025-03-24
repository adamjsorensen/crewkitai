
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CompassTaskDisplay } from '@/types/compass';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CalendarDialogProps {
  task: CompassTaskDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CalendarDialog: React.FC<CalendarDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : new Date()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddToCalendar = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a due date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the task's due date
      const { error } = await supabase
        .from('compass_tasks')
        .update({ 
          due_date: selectedDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) {
        console.error('Error updating due date:', error);
        toast({
          title: "Error",
          description: "Failed to update due date. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Generate the iCal file for download
      const icalContent = generateICalEvent(task, selectedDate);
      downloadICalFile(icalContent, `task-${task.id}.ics`);

      toast({
        title: "Task Scheduled",
        description: `Due date set to ${format(selectedDate, 'PPP')} and calendar file downloaded`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error in update due date:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to generate iCal content
  const generateICalEvent = (task: CompassTaskDisplay, date: Date): string => {
    const now = new Date();
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(end.getHours() + 1); // Default 1 hour duration

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Strategic Compass//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `DTSTAMP:${formatICalDate(now)}`,
      `UID:task-${task.id}@strategic-compass`,
      `DTSTART:${formatICalDate(start)}`,
      `DTEND:${formatICalDate(end)}`,
      `SUMMARY:${task.task_text}`,
      `DESCRIPTION:${task.reasoning || 'Task from Strategic Compass'}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
  };

  // Helper function to format date for iCal
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Function to download iCal file
  const downloadICalFile = (content: string, filename: string): void => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add to Calendar</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Task</h3>
            <p className="text-sm">{task.task_text}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Due Date</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>This will set the task due date and generate a calendar file you can import into your preferred calendar app.</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleAddToCalendar}
            disabled={isSubmitting || !selectedDate}
          >
            {isSubmitting ? 'Processing...' : 'Add to Calendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDialog;
