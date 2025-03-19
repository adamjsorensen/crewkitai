
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Mail, Bell, Lock, Shield, User, LogOut } from "lucide-react";

type SettingsFormValues = {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isPending, setIsPending] = useState(false);
  
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      email_notifications: true,
      push_notifications: false,
      sms_notifications: false,
      marketing_emails: false,
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsPending(true);
      
      // Simulate saving settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Settings updated successfully");
      setIsPending(false);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
      setIsPending(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      if (!user?.email) {
        toast.error("No email found for password reset");
        return;
      }

      setIsPending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/dashboard/settings/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent");
      setIsPending(false);
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Failed to send password reset email");
      setIsPending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteAccount = async () => {
    // In a real application, you would want to add confirmation dialogs
    try {
      setIsPending(true);
      
      // This is a placeholder for account deletion logic
      toast.success("Account deletion request submitted");
      setIsPending(false);
      
      // In a real app, you might want to sign the user out after account deletion
      // await signOut();
      // navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
      setIsPending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <nav className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={() => navigate("/dashboard/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left font-semibold bg-accent"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={handlePasswordReset}
              >
                <Lock className="mr-2 h-4 w-4" />
                Security
              </Button>
              
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </nav>
            
            <Separator className="my-4" />
            
            <div className="px-4 py-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Account Status</div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-muted-foreground">Active</div>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Active
                </Badge>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="flex items-center">
                  <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span className="text-xs">{user?.email?.substring(0, 15)}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about activity and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="push_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <FormLabel>Push Notifications</FormLabel>
                            <FormDescription>
                              Receive push notifications in the app
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sms_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <FormLabel>SMS Notifications</FormLabel>
                            <FormDescription>
                              Receive important notifications via SMS
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="marketing_emails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-3 rounded-lg border">
                          <div className="space-y-0.5">
                            <FormLabel>Marketing Emails</FormLabel>
                            <FormDescription>
                              Receive emails about new features and updates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that will affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-destructive p-4">
                  <h3 className="font-medium">Delete Account</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once you delete your account, there is no going back. This action is not reversible.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="mt-4"
                    onClick={handleDeleteAccount}
                    disabled={isPending}
                  >
                    {isPending ? "Processing..." : "Delete Account"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
