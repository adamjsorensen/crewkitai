
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, BarChart3, Calendar, FileText } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 md:col-span-2 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto py-4">
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-4 w-full max-w-xl mx-auto">
            <TabsTrigger value="home" className="flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5" onClick={() => navigate("/dashboard/compass")}>
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-1.5" onClick={() => navigate("/dashboard/financial")}>
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Financial</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1.5" onClick={() => navigate("/dashboard/content")}>
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Content</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="home">
            <DashboardHome />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
