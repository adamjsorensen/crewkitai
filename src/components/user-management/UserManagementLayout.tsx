
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, UserPlus, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Outlet, useLocation } from "react-router-dom";

interface UserManagementLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
}

const UserManagementLayout = ({ children, activeTab = "user-list" }: UserManagementLayoutProps) => {
  const { isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine which tab is active based on the current route
  const getActiveTab = () => {
    if (location.pathname.includes("/user-details/")) return null;
    if (location.pathname.endsWith("/user-list")) return "user-list";
    if (location.pathname.endsWith("/add-user")) return "add-user";
    if (location.pathname.endsWith("/activity-logs")) return "activity-logs";
    return "user-list"; // Default tab
  };

  const currentTab = getActiveTab();

  // Redirect if not admin
  React.useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the user management area",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, permissions, and monitor user activity
            </p>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-6">
          {/* Only show tabs when not in detail view */}
          {currentTab && (
            <Tabs value={currentTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger 
                  value="user-list" 
                  onClick={() => navigate("/dashboard/user-management/user-list")}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="add-user" 
                  onClick={() => navigate("/dashboard/user-management/add-user")}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add User</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="activity-logs" 
                  onClick={() => navigate("/dashboard/user-management/activity-logs")}
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  <span>Activity</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Outlet for nested routes */}
          <div className={currentTab ? "mt-6" : ""}>
            {children || <Outlet />}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagementLayout;
