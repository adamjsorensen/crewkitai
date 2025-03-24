
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompassTaskDisplay } from '@/types/compass';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReminderDialogProps {
  task: CompassTaskDisplay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const timeOptions = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '1440', label: '1 day' },
];

const ReminderDialog: React.FC<ReminderDialogProps> = ({
  task,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSetReminder = async () => {
    if (!selectedDate) {
      toast({
        title: "Date Required",
        description: "Please select a reminder date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate the reminder time
      const reminderDate = new Date(selectedDate);
      // Add the selected minutes to the current time
      reminderDate.setMinutes(reminderDate.getMinutes() + parseInt(selectedTime));

      const { error } = await supabase
        .from('compass_reminders')
        .insert({
          task_id: task.id,
          remind_at: reminderDate.toISOString(),
          created_at: new Date().toISOString(),
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
        description: `You'll be reminded about "${task.task_text}" on ${format(reminderDate, 'MMM d, yyyy h:mm a')}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error in set reminder:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Set Reminder</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Task</h3>
            <p className="text-sm">{task.task_text}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Remind me on</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
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
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Remind me in</h3>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSetReminder} 
            disabled={isSubmitting || !selectedDate}
          >
            {isSubmitting ? 'Setting reminder...' : 'Set Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
