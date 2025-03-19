
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Clock, 
  ChevronRight, 
  PaintBucket, 
  Brush, 
  FileEdit,
  Home,
  Bell
} from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal and business information
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="flex flex-col space-y-1">
              <Button
                variant="ghost"
                className="justify-start px-4 py-2 h-auto text-left font-semibold bg-accent"
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
            
            <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
              {isLoading ? (
                <div className="h-24 w-24 rounded-full bg-muted-foreground/20 animate-pulse mb-4"></div>
              ) : (
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="" alt={profile?.full_name || "User"} />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name ? getInitials(profile.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              {isLoading ? (
                <>
                  <div className="h-5 w-32 bg-muted-foreground/20 animate-pulse rounded"></div>
                  <div className="h-4 w-40 bg-muted-foreground/20 animate-pulse rounded mt-2"></div>
                </>
              ) : (
                <>
                  <h3 className="font-medium text-center">{profile?.full_name || "Your Name"}</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    {user?.email}
                  </p>
                </>
              )}
              
              <div className="mt-4 flex gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
                <Badge variant="outline">
                  Pro
                </Badge>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Business Profile Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>
                    Your painting business information
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/profile/business")}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-5 w-3/4 bg-muted-foreground/20 animate-pulse rounded"></div>
                    <div className="h-5 w-1/2 bg-muted-foreground/20 animate-pulse rounded"></div>
                    <div className="h-5 w-2/3 bg-muted-foreground/20 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Company Name</h3>
                        <p className="text-muted-foreground">
                          {profile?.company_name || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Business Address</h3>
                        <p className="text-muted-foreground">
                          {profile?.business_address || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Website</h3>
                        <p className="text-muted-foreground">
                          {profile?.website ? (
                            <a href={profile.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                              {profile.website}
                            </a>
                          ) : (
                            "Not specified"
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Brush className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Company Description</h3>
                        <p className="text-muted-foreground">
                          {profile?.company_description || "No company description provided."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personal Profile Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your contact details and personal information
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/profile/personal")}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-5 w-3/4 bg-muted-foreground/20 animate-pulse rounded"></div>
                    <div className="h-5 w-1/2 bg-muted-foreground/20 animate-pulse rounded"></div>
                    <div className="h-5 w-2/3 bg-muted-foreground/20 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Full Name</h3>
                        <p className="text-muted-foreground">
                          {profile?.full_name || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-muted-foreground">
                          {user?.email || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p className="text-muted-foreground">
                          {profile?.phone || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Personal Address</h3>
                        <p className="text-muted-foreground">
                          {profile?.address || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Account Created</h3>
                        <p className="text-muted-foreground">
                          {profile?.created_at ? formatDate(profile.created_at) : "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common profile and account tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-between h-auto py-3" onClick={() => navigate("/dashboard/profile/business")}>
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 mr-3 text-primary" />
                      Edit Business Profile
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="justify-between h-auto py-3" onClick={() => navigate("/dashboard/profile/personal")}>
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-primary" />
                      Edit Personal Profile
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="justify-between h-auto py-3" onClick={() => navigate("/dashboard/settings")}>
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 mr-3 text-primary" />
                      Notification Settings
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="outline" className="justify-between h-auto py-3" onClick={() => navigate("/dashboard/financial")}>
                    <div className="flex items-center">
                      <PaintBucket className="h-5 w-5 mr-3 text-primary" />
                      View Financial Data
                    </div>
                    <ChevronRight className="h-4 w-4" />
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

export default ProfilePage;
