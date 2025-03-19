
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BusinessProfilePage from "./BusinessProfilePage";
import PersonalProfilePage from "./PersonalProfilePage";
import SettingsPage from "./SettingsPage";
import { Briefcase, User, Settings } from "lucide-react";

const ProfilePage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("business");

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Tabs defaultValue="business" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Business</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <BusinessProfilePage />
          </TabsContent>
          
          <TabsContent value="personal">
            <PersonalProfilePage />
          </TabsContent>
          
          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
