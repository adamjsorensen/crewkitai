
import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Phone, Home, Upload } from "lucide-react";

type PersonalProfileFormValues = {
  full_name: string;
  phone: string;
  address: string;
  bio: string;
};

const PersonalProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const form = useForm<PersonalProfileFormValues>({
    defaultValues: {
      full_name: "",
      phone: "",
      address: "",
      bio: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        form.reset({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          bio: data.bio || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      }
    };
    
    fetchProfile();
  }, [user, form]);

  const onSubmit = async (data: PersonalProfileFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsPending(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast.success("Personal profile updated successfully");
      setIsPending(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update personal profile");
      setIsPending(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personal Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your personal information and preferences
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={() => navigate("/dashboard/profile")}
              >
                Profile Overview
              </Button>
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={() => navigate("/dashboard/profile/business")}
              >
                Business Information
              </Button>
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left font-semibold bg-accent"
              >
                Personal Information
              </Button>
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={() => navigate("/dashboard/settings")}
              >
                Account Settings
              </Button>
            </nav>
            
            <Separator className="my-4" />
            
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src="" alt={profile?.full_name || "User"} />
                <AvatarFallback className="text-lg">
                  {profile?.full_name ? getInitials(profile.full_name) : "U"}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-medium text-center">{profile?.full_name || "Your Name"}</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                {user?.email}
              </p>
              <Button variant="outline" size="sm" className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="John Smith"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your full name as it appears to customers
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="(555) 123-4567"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your contact phone number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personal Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="123 Main St, Columbus, OH 43215"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your personal address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Professional painter with 10 years of experience specializing in residential interiors..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief biography describing your experience and expertise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save Personal Profile"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PersonalProfilePage;
