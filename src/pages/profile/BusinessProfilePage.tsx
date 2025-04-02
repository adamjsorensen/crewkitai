
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PaintBucket, Save, ArrowLeft } from "lucide-react";
import CompassOnboarding from "@/components/compass/CompassOnboarding";
import { CompassUserProfile } from "@/types/compass";

const BusinessProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<CompassUserProfile | null>(null);
  
  const handleProfileComplete = (updatedProfile: CompassUserProfile) => {
    setProfile(updatedProfile);
    toast.success("Business profile updated successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
            <p className="text-muted-foreground mt-2">
              Update your painting business information
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/profile')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
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
                    {profile?.business_name || "Your Painting Business"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your business profile to showcase your professional services
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your painting company details and specialties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompassOnboarding 
                  onComplete={handleProfileComplete}
                  existingProfile={profile}
                  showSaveButton={true}
                  buttonText="Save Business Profile"
                  buttonIcon={<Save className="h-4 w-4 ml-2" />}
                  enableAutoSave={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BusinessProfilePage;
