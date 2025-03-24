
import React, { useState } from 'react';
import { format, addMinutes, addHours, addDays } from 'date-fns';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CompassTask } from '@/types/compass';

interface TaskReminderDialogProps {
  task: CompassTask;
  onReminderSet: () => void;
}

const TaskReminderDialog = ({ task, onReminderSet }: TaskReminderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState('15min');
  const [notificationMethod, setNotificationMethod] = useState('Email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const calculateReminderTime = (): Date => {
    const now = new Date();
    
    switch (reminderTime) {
      case '15min':
        return addMinutes(now, 15);
      case '30min':
        return addMinutes(now, 30);
      case '1hour':
        return addHours(now, 1);
      case '3hours':
        return addHours(now, 3);
      case '1day':
        return addDays(now, 1);
      default:
        return addMinutes(now, 15);
    }
  };

  const handleSetReminder = async () => {
    try {
      setIsSubmitting(true);
      
      const triggerTime = calculateReminderTime();
      
      const { error } = await supabase.from('compass_reminders').insert({
        task_id: task.id,
        method: notificationMethod,
        trigger_at: triggerTime.toISOString(),
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Reminder set",
        description: `We'll remind you about "${task.task_text}" at ${format(triggerTime, 'PPp')}`,
      });
      
      onReminderSet();
      setOpen(false);
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast({
        title: "Couldn't set reminder",
        description: "There was a problem setting your reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 ml-2">
          <Bell className="h-4 w-4 mr-1" />
          Remind
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          <DialogDescription>
            Choose when you want to be reminded about this task.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Remind me in</Label>
            <Select
              value={reminderTime}
              onValueChange={setReminderTime}
            >
              <SelectTrigger id="reminder-time">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15min">15 minutes</SelectItem>
                <SelectItem value="30min">30 minutes</SelectItem>
                <SelectItem value="1hour">1 hour</SelectItem>
                <SelectItem value="3hours">3 hours</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Notification method</Label>
            <RadioGroup 
              value={notificationMethod} 
              onValueChange={setNotificationMethod}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Email" id="notification-email" />
                <Label htmlFor="notification-email">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SMS" id="notification-sms" disabled />
                <Label htmlFor="notification-sms" className="text-muted-foreground">SMS (coming soon)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSetReminder} disabled={isSubmitting}>
            {isSubmitting ? "Setting..." : "Set Reminder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskReminderDialog;
