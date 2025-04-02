// Migrated from old UserDetailsPage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/user"; // Ensure this type is appropriate or adjust
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLogActivity } from "@/hooks/useLogActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserCog, 
  ChevronLeft, 
  Shield, 
  History, 
  CreditCard, 
  Mail, 
  Building, 
  Phone, 
  Globe, 
  MapPin,
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivityLogs } from "@/hooks/useActivityLogs";
import AdminLayout from "@/components/admin/AdminLayout"; // Use AdminLayout

// --- Helper Components (Consider moving these to src/components/admin/users/) ---

const userProfileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  company_name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().optional(),
  business_address: z.string().optional(),
  company_description: z.string().optional(),
  role: z.enum(["admin", "user"])
});

const PasswordResetDialog = ({ 
  open, 
  onOpenChange, 
  userId, 
  userName
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}) => {
  const { toast } = useToast();
  const { logActivity } = useLogActivity();
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Replace mock delay with actual Supabase password reset call
      // Example: await supabase.auth.resetPasswordForEmail(userEmail)
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      await logActivity({
        actionType: 'reset_password',
        actionDetails: { method: 'admin_initiated' },
        affectedUserId: userId,
        affectedResourceType: 'user'
      });
      
      toast({
        title: "Password reset email sent",
        description: `A password reset email has been sent to the user.`
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset user password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            This will send a password reset email to {userName}.
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            The user will receive an email with instructions to set a new password.
            Their current password will continue to work until they complete the reset process.
          </AlertDescription>
        </Alert>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleResetPassword} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UserActivitySection = ({ userId }: { userId: string }) => {
  const { logs, isLoading } = useActivityLogs({ 
    userId, 
    limit: 5 // Show only recent logs here
  });

  const getActionLabel = (actionType: string) => {
    return actionType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Activity</h3>
      
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="flex gap-4 items-start pb-4 border-b last:border-b-0">
              <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {getActionLabel(log.action_type)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(log.created_at), 'PPpp')}
                </p>
                {/* Optionally display simple details */}
                {/* <pre className="text-xs mt-1 bg-muted p-1 rounded">{JSON.stringify(log.action_details)}</pre> */}
              </div>
            </div>
          ))}
          
          {/* Update link to point to the new admin activity log page */}
          <Button variant="outline" className="w-full" asChild>
            <a href={`/dashboard/admin/activity-logs?user=${userId}`}>
              View All Activity
            </a>
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p>No activity recorded yet</p>
        </div>
      )}
    </div>
  );
};

// --- Main Page Component ---

const AdminUserDetailsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useLogActivity();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      full_name: "",
      company_name: "",
      email: "",
      phone: "",
      website: "",
      business_address: "",
      company_description: "",
      role: "user"
    }
  });

  // Fetch user data (profile + role)
  const { data: user, isLoading, error: fetchError } = useQuery<User, Error>({
    queryKey: ["adminUser", userId], // Use a different query key for admin context if needed
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error(profileError.message || "Failed to fetch user profile.");
      }
      if (!profile) throw new Error("User profile not found.");

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      // Don't throw error if role fetch fails, just default to 'user'
      if (roleError) {
        console.warn(`Error fetching role for user ${userId}:`, roleError);
      }

      // Combine profile and role
      return {
        ...profile,
        role: roleData?.role || "user"
      } as User; // Assert type here
    },
    enabled: !!userId, // Only run query if userId is available
    retry: false, // Don't retry on error for fetching a specific user
  });

  // Update form when user data loads
  React.useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name || "",
        company_name: user.company_name || "",
        email: user.email || "",
        phone: user.phone || "",
        website: user.website || "",
        business_address: user.business_address || "",
        company_description: user.company_description || "",
        role: user.role || "user"
      });
    }
  }, [user, form]);

  // Mutation to update user data
  const updateUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof userProfileSchema>) => {
      if (!userId) throw new Error("User ID is missing");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          company_name: values.company_name,
          // email: values.email, // Avoid updating email directly? Supabase auth handles email.
          phone: values.phone,
          website: values.website,
          business_address: values.business_address,
          company_description: values.company_description
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update role if changed
      if (user?.role !== values.role) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingRole) {
          const { error: roleError } = await supabase
            .from("user_roles")
            .update({ role: values.role })
            .eq("user_id", userId);
          if (roleError) throw roleError;
        } else {
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: values.role });
          if (roleError) throw roleError;
        }
      }

      return { ...user, ...values }; // Return optimistic update
    },
    onSuccess: async (updatedUser) => {
      toast({
        title: "User updated",
        description: "User profile has been updated successfully."
      });
      
      await logActivity({
        actionType: 'update_user',
        actionDetails: { 
          updated_fields: form.formState.dirtyFields, // Log which fields were changed
          role_changed: user?.role !== updatedUser?.role // Log if role changed
        },
        affectedUserId: userId,
        affectedResourceType: 'user'
      });
      
      setIsEditing(false);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["adminUser", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Invalidate the main list too
    },
    onError: (error: any) => {
      console.error("Error updating user:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (values: z.infer<typeof userProfileSchema>) => {
    updateUserMutation.mutate(values);
  };

  // Prepare details for display
  const userDetailsList = user ? [
    { label: "Full Name", value: user.full_name, icon: <UserCog className="h-4 w-4 text-muted-foreground" /> },
    { label: "Email", value: user.email, icon: <Mail className="h-4 w-4 text-muted-foreground" /> },
    { label: "Company", value: user.company_name, icon: <Building className="h-4 w-4 text-muted-foreground" /> },
    { label: "Role", value: user.role, icon: <Shield className="h-4 w-4 text-muted-foreground" /> },
    { label: "Phone", value: user.phone, icon: <Phone className="h-4 w-4 text-muted-foreground" /> },
    { label: "Website", value: user.website, icon: <Globe className="h-4 w-4 text-muted-foreground" /> },
    { label: "Business Address", value: user.business_address, icon: <MapPin className="h-4 w-4 text-muted-foreground" /> },
  ] : [];

  // --- Render Logic ---

  if (isLoading) {
    return (
      <AdminLayout title="Loading User Details..." description="Please wait.">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (fetchError) {
     return (
      <AdminLayout title="Error" description="Failed to load user details.">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fetchError.message}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4 gap-1"
          onClick={() => navigate("/dashboard/admin/users")}
        >
          <ChevronLeft className="h-4 w-4" /> Back to users
        </Button>
      </AdminLayout>
    );
  }

  if (!user) {
    // Should be caught by fetchError usually, but just in case
    return (
      <AdminLayout title="User Not Found" description="The requested user could not be found.">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>User not found.</AlertDescription>
        </Alert>
         <Button 
          variant="outline" 
          size="sm" 
          className="mt-4 gap-1"
          onClick={() => navigate("/dashboard/admin/users")}
        >
          <ChevronLeft className="h-4 w-4" /> Back to users
        </Button>
      </AdminLayout>
    );
  }

  return (
    // Use AdminLayout with dynamic title
    <AdminLayout title={user.full_name || 'User Details'} description={`Manage profile and view activity for ${user.email}`}>
      <div className="space-y-6">
        {/* Keep back button? AdminLayout now has sidebar, maybe remove explicit back button */}
        {/* <Button 
          variant="outline" 
          size="sm" 
          className="w-fit gap-1 mb-4" // Added mb-4
          onClick={() => navigate("/dashboard/admin/users")} // Updated navigation path
        >
          <ChevronLeft className="h-4 w-4" /> Back to users
        </Button> */}

        {/* Header section (simplified as title is in layout) */}
        {/* 
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{user.full_name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {user.email} · 
              <span className="font-medium capitalize ml-1">{user.role || "user"}</span>
              {user.role === "admin" && <Shield className="h-3 w-3 text-primary ml-1" />}
            </p>
          </div>
        </div> 
        */}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-1.5">
              <UserCog className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1.5">
              <History className="h-4 w-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              <span>Billing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-4 md:p-6">
              {isEditing ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Edit User Profile</h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Form Fields - Copied from old component */} 
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                {/* Make email read-only? Usually handled by auth */}
                                <Input placeholder="john@example.com" {...field} readOnly disabled /> 
                              </FormControl>
                              <FormDescription>Email cannot be changed here.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="company_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Acme Corp" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Admin users have access to all management features.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="business_address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Business Address</FormLabel>
                              <FormControl>
                                <Input placeholder="123 Main St, Anytown, USA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="company_description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Company Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Brief description of the company..." 
                                  {...field} 
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={updateUserMutation.isPending}
                        >
                          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-semibold">User Information</h3>
                    <div className="flex flex-wrap gap-2"> {/* Use flex-wrap */} 
                      <Button size="sm" variant="outline" onClick={() => setIsPasswordResetOpen(true)}>
                        Reset Password
                      </Button>
                      <Button size="sm" onClick={() => setIsEditing(true)}>
                        Edit User Profile
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"> {/* Adjusted gap */} 
                    {userDetailsList.map((detail, index) => (
                      // Only render if value exists
                      detail.value ? (
                        <div key={index} className={detail.label === "Business Address" ? "md:col-span-2" : ""}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {detail.icon}
                            <h4 className="text-sm font-medium text-muted-foreground">{detail.label}</h4>
                          </div>
                          <p className={`text-sm ${detail.label === "Role" ? "capitalize" : ""}`}>
                            {detail.value}
                          </p>
                        </div>
                      ) : null
                    ))}
                  </div>

                  {user.company_description && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium text-muted-foreground">Company Description</h4>
                      </div>
                      <p className="text-sm whitespace-pre-line">{user.company_description}</p>
                    </div>
                  )}
                </>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="p-4 md:p-6">
              <UserActivitySection userId={userId || ""} />
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card className="p-4 md:p-6">
              {/* Placeholder for Billing Info */}
              <Alert>
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Billing management features are not yet implemented.
                </AlertDescription>
              </Alert>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Password Reset Dialog */} 
        <PasswordResetDialog 
          open={isPasswordResetOpen}
          onOpenChange={setIsPasswordResetOpen}
          userId={userId || ""}
          // Ensure user?.full_name is not null/undefined before passing
          userName={user?.full_name || user?.email || 'this user'}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetailsPage; 