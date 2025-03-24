
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const RemindersSettings = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Reminders</CardTitle>
          <CardDescription>
            Configure how you receive notifications for your tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails when task reminders are triggered
              </p>
            </div>
            <Switch id="email-notifications" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-notifications" className="text-base font-medium">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive text messages when task reminders are triggered
              </p>
            </div>
            <Switch id="sms-notifications" disabled />
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> SMS notifications are coming soon. For now, you can set reminders
              directly on individual tasks and receive them via email.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersSettings;
