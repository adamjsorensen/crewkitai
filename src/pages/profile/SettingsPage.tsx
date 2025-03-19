
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Key, Shield, LogOut, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const SettingsPage = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotificationToggle = (checked: boolean) => {
    setEmailNotifications(checked);
    toast.success(`Email notifications ${checked ? "enabled" : "disabled"}`);
  };

  const handlePasswordReset = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      
      setPassword("");
      setConfirmPassword("");
      setIsResetPasswordOpen(false);
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    try {
      // Note: In a real application, this would need admin rights or a custom API
      // This is a simplified example
      toast.error("Account deletion is not implemented in this demo");
      setIsDeleteAccountOpen(false);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and security
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your account via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your new password below. Password must be at least 6 characters.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handlePasswordReset} disabled={isSubmitting}>
                          {isSubmitting ? "Updating..." : "Update Password"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Connected Account
                </p>
                <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <Badge variant="outline">Primary</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Delete Account</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Dialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. Are you sure you want to permanently delete your account?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteAccountOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSubmitting}>
                        {isSubmitting ? "Deleting..." : "Delete Account"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Account Access
              </CardTitle>
              <CardDescription>
                Manage your login sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sign Out</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Sign out from your current session
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
