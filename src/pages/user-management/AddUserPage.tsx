
import React from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLogActivity } from "@/hooks/useLogActivity";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Schema for creating a new user
const newUserSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  company_name: z.string().min(1, "Company name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"]),
  phone: z.string().optional(),
  website: z.string().optional(),
  business_address: z.string().optional(),
  company_description: z.string().optional(),
  send_welcome_email: z.boolean().default(true)
});

const AddUserPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logActivity } = useLogActivity();
  
  const form = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      full_name: "",
      email: "",
      company_name: "",
      password: "",
      role: "user",
      phone: "",
      website: "",
      business_address: "",
      company_description: "",
      send_welcome_email: true
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof newUserSchema>) => {
    try {
      // In a real production environment, you would use appropriate methods
      // depending on your auth provider. This is a simplified example.
      
      // Create the user in auth system (returns the user ID)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: values.email,
        password: values.password,
        email_confirm: true,
      });

      if (authError) throw authError;
      
      // The auth user triggers the DB function to create a profile
      // But we need to update it with the additional info
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          company_name: values.company_name,
          email: values.email,
          phone: values.phone,
          website: values.website,
          business_address: values.business_address,
          company_description: values.company_description
        })
        .eq("id", authUser.user?.id);

      if (profileError) throw profileError;

      // Set role if not the default "user"
      if (values.role !== "user") {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authUser.user?.id,
            role: values.role
          });

        if (roleError) throw roleError;
      }

      // Log activity
      await logActivity({
        actionType: 'create_user',
        actionDetails: { 
          email: values.email,
          role: values.role,
          send_welcome_email: values.send_welcome_email
        },
        affectedUserId: authUser.user?.id,
        affectedResourceType: 'user'
      });

      toast({
        title: "User created",
        description: "The user has been successfully created."
      });

      // Redirect to user list
      navigate("/dashboard/user-management/user-list");
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error creating user",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold mb-4">Create New User</h3>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          New users will be created with a confirmed email. In a production environment,
          you would typically send them an email invitation.
        </AlertDescription>
      </Alert>
      
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters long
                    </FormDescription>
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
                      <Input placeholder="Acme Painting" {...field} />
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
                      Admin users have access to all management features
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
                    <FormLabel>Phone (Optional)</FormLabel>
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
                    <FormLabel>Website (Optional)</FormLabel>
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
                    <FormLabel>Business Address (Optional)</FormLabel>
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
                    <FormLabel>Company Description (Optional)</FormLabel>
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
                onClick={() => navigate("/dashboard/user-management/user-list")}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </>
  );
};

export default AddUserPage;
