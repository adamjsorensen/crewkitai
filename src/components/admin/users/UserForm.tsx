
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { User } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const formSchema = z.object({
  full_name: z.string().min(2, { message: "Name is required" }),
  company_name: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["user", "admin"]).default("user"),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  user?: User;
  onClose: () => void;
  onSuccess: () => void;
}

const UserForm = ({ user, onClose, onSuccess }: UserFormProps) => {
  const { toast } = useToast();
  const isEditing = !!user;

  // Initialize form with user data if editing
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      company_name: user?.company_name || "",
      email: user?.email || "",
      role: user?.role || "user",
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user) return null;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          company_name: values.company_name,
          email: values.email
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role if changed
      if (values.role !== user.role) {
        // Delete existing role
        const { error: deleteRoleError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.id);

        if (deleteRoleError) throw deleteRoleError;

        // Insert new role
        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: values.role });

        if (insertRoleError) throw insertRoleError;
      }

      return null;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Note: In a real app, you'd likely use Supabase Auth Admin API to create users
      // This is a simplified example that only updates profiles table
      
      // Create a UUID for the new user
      const newUserId = crypto.randomUUID();
      
      // Create profile entry with the generated ID
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: newUserId,
          full_name: values.full_name,
          company_name: values.company_name,
          email: values.email,
        })
        .select()
        .single();

      if (error) throw error;

      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: data.id, role: values.role });

      if (roleError) throw roleError;

      return data;
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateUserMutation.mutate(values);
    } else {
      createUserMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Painting Inc." {...field} />
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
                <Input 
                  type="email" 
                  placeholder="john@example.com" 
                  {...field}
                  disabled={isEditing} // Can't change email in edit mode
                />
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createUserMutation.isPending || updateUserMutation.isPending}
          >
            {createUserMutation.isPending || updateUserMutation.isPending ? (
              <span className="flex items-center">
                <span className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                Saving...
              </span>
            ) : (
              isEditing ? "Update User" : "Create User"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default UserForm;
