
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const tabs = [
    { id: "user-list", label: "Users", icon: <Users className="h-4 w-4" />, path: "/dashboard/user-management/user-list" },
    { id: "add-user", label: "Add User", icon: <UserPlus className="h-4 w-4" />, path: "/dashboard/user-management/add-user" },
    { id: "activity-logs", label: "Activity", icon: <History className="h-4 w-4" />, path: "/dashboard/user-management/activity-logs" }
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 max-w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">User Management</h1>
            <p className="text-sm md:text-base text-muted-foreground truncate">
              Manage users, permissions, and monitor user activity
            </p>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-4 md:p-6 w-full overflow-hidden">
          {/* Only show tabs when not in detail view */}
          {currentTab && (
            <Tabs value={currentTab} className="w-full">
              <ScrollArea className="w-full" orientation="horizontal">
                <TabsList className="grid grid-cols-3 w-full max-w-md">
                  {tabs.map(tab => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      onClick={() => navigate(tab.path)}
                      className="flex items-center gap-2 whitespace-nowrap min-h-[2.75rem]"
                    >
                      {tab.icon}
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </Tabs>
          )}

          {/* Outlet for nested routes */}
          <div className={currentTab ? "mt-6 w-full max-w-full overflow-hidden" : "w-full max-w-full overflow-hidden"}>
            {children || <Outlet />}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagementLayout;
