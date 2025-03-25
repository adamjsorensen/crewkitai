
import React from "react";
import { Outlet } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { Users, UserCog, UserPlus, History } from "lucide-react";

const UserManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Determine which tab is active based on the current route
  const getActiveTab = () => {
    if (currentPath.includes("/user-details/")) return null;
    if (currentPath.endsWith("/user-list")) return "user-list";
    if (currentPath.endsWith("/add-user")) return "add-user";
    if (currentPath.endsWith("/activity-logs")) return "activity-logs";
    return "user-list"; // Default tab
  };

  const activeTab = getActiveTab();

  return (
    <AdminLayout activeTab="users">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, permissions, and monitor user activity
          </p>
        </div>

        {/* Only show tabs when not in detail view */}
        {activeTab && (
          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger 
                value="user-list" 
                onClick={() => navigate("/dashboard/admin/users/user-list")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="add-user" 
                onClick={() => navigate("/dashboard/admin/users/add-user")}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add User</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activity-logs" 
                onClick={() => navigate("/dashboard/admin/users/activity-logs")}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Outlet for nested routes */}
        <Outlet />
      </div>
    </AdminLayout>
  );
};

export default UserManagementPage;
