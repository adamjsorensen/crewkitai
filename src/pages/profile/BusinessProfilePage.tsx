
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Globe, PaintBucket } from "lucide-react";

type BusinessProfileFormValues = {
  company_name: string;
  business_address: string;
  website: string;
  company_description: string;
};

const BusinessProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const form = useForm<BusinessProfileFormValues>({
    defaultValues: {
      company_name: "",
      business_address: "",
      website: "",
      company_description: "",
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
          company_name: data.company_name || "",
          business_address: data.business_address || "",
          website: data.website || "",
          company_description: data.company_description || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      }
    };
    
    fetchProfile();
  }, [user, form]);

  const onSubmit = async (data: BusinessProfileFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsPending(true);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: data.company_name,
          business_address: data.business_address,
          website: data.website,
          company_description: data.company_description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      toast.success("Business profile updated successfully");
      setIsPending(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update business profile");
      setIsPending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your painting business information
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
                className="justify-start px-4 py-2 h-auto text-left font-semibold bg-accent"
              >
                Business Information
              </Button>
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left"
                onClick={() => navigate("/dashboard/profile/personal")}
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
            
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center space-x-2">
                <PaintBucket className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-medium">
                    {profile?.company_name || "Your Painting Business"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your business profile to showcase your professional services
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your painting company details displayed to clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Your Painting Company"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            The name of your painting business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="business_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="123 Painter St, Columbus, OH 43215"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your business location or service area
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Website</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="www.yourpaintingcompany.com"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your business website address (if available)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Professional painting services with over 10 years of experience..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your painting business, services, and expertise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Saving..." : "Save Business Profile"}
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

export default BusinessProfilePage;
