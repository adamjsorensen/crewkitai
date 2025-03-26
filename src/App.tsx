import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import CompassPage from "@/pages/CompassPage";
import PGCoachPage from "@/pages/PGCoachPage";
import ContentPage from "@/pages/ContentPage";
import FinancialPage from "@/pages/FinancialPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import AISettingsPage from "@/pages/admin/AISettingsPage";
import CompassSettingsPage from "@/pages/admin/CompassSettingsPage";
import FeatureFlagsPage from "@/pages/admin/FeatureFlagsPage";
import AppSettingsPage from "@/pages/admin/AppSettingsPage";
import DatabasePage from "@/pages/admin/DatabasePage";
import UserManagementPage from "@/pages/user-management/UserManagementPage";
import UserListPage from "@/pages/user-management/UserListPage";
import AddUserPage from "@/pages/user-management/AddUserPage";
import ActivityLogsPage from "@/pages/user-management/ActivityLogsPage";
import UserDetailsPage from "@/pages/user-management/UserDetailsPage";
import UserListPage from "@/pages/admin/users/UserListPage";
import UserDetailsPage from "@/pages/admin/users/UserDetailsPage";
import ActivityLogsPage from "@/pages/admin/users/ActivityLogsPage";
import AddUserPage from "@/pages/admin/users/AddUserPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/compass" element={<CompassPage />} />
              <Route path="/dashboard/pg-coach" element={<PGCoachPage />} />
              <Route path="/dashboard/content" element={<ContentPage />} />
              <Route path="/dashboard/financial" element={<FinancialPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              
              {/* Admin routes */}
              <Route path="/dashboard/admin/ai-settings" element={<AISettingsPage />} />
              <Route path="/dashboard/admin/compass-settings" element={<CompassSettingsPage />} />
              <Route path="/dashboard/admin/feature-flags" element={<FeatureFlagsPage />} />
              <Route path="/dashboard/admin/app-settings" element={<AppSettingsPage />} />
              <Route path="/dashboard/admin/database" element={<DatabasePage />} />
              
              {/* Admin user management routes */}
              <Route path="/dashboard/admin/users/user-list" element={<UserListPage />} />
              <Route path="/dashboard/admin/users/user-details/:userId" element={<UserDetailsPage />} />
              <Route path="/dashboard/admin/users/activity-logs" element={<ActivityLogsPage />} />
              <Route path="/dashboard/admin/users/add-user" element={<AddUserPage />} />
              
              {/* User management routes */}
              <Route path="/dashboard/user-management" element={<UserManagementPage />}>
                <Route path="user-list" element={<UserListPage />} />
                <Route path="add-user" element={<AddUserPage />} />
                <Route path="activity-logs" element={<ActivityLogsPage />} />
                <Route path="user-details/:userId" element={<UserDetailsPage />} />
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
