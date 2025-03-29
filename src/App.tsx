
import React, { useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import AuthPage from "@/pages/auth/AuthPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LandingPage from "@/pages/landing/LandingPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import CompassPage from "@/pages/dashboard/CompassPage";
import PGCoachPage from "@/pages/dashboard/PGCoachPage";
import AISettingsPage from "@/pages/admin/AISettingsPage";
import PromptsPage from "@/pages/admin/PromptsPage";
import UserListPage from "@/pages/admin/UserListPage";
import UserDetailsPage from "@/pages/admin/UserDetailsPage";
import FinancialPage from "@/pages/dashboard/FinancialPage";
import ParametersPage from "@/pages/admin/ParametersPage";
import ContentSettingsPage from "@/pages/admin/ContentSettingsPage";
import PromptLibraryPage from "@/pages/dashboard/PromptLibraryPage";
import PromptPage from "@/pages/dashboard/PromptPage";
import GeneratedContentPage from "@/pages/dashboard/GeneratedContentPage";
import SavedContentPage from "@/pages/dashboard/SavedContentPage";
import SavedContentDetailPage from "@/pages/dashboard/SavedContentDetailPage";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="crewkit-ui-theme">
      <AuthProvider>
        <SidebarProvider>
          <MainApp />
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !location.pathname.startsWith("/auth") && location.pathname !== "/") {
      navigate("/auth");
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
      <Route path="/dashboard/settings" element={<ProtectedRoute element={<SettingsPage />} />} />
      <Route path="/dashboard/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
      <Route path="/dashboard/compass" element={<ProtectedRoute element={<CompassPage />} />} />
      <Route path="/dashboard/pg-coach" element={<ProtectedRoute element={<PGCoachPage />} />} />
      <Route path="/dashboard/ai-coach" element={<Navigate to="/dashboard/pg-coach" replace />} />
      <Route path="/dashboard/financial" element={<ProtectedRoute element={<FinancialPage />} />} />
      
      {/* Content Generator Routes */}
      <Route path="/dashboard/prompt-library" element={<ProtectedRoute element={<PromptLibraryPage />} />} />
      <Route path="/dashboard/prompt/:promptId" element={<ProtectedRoute element={<PromptPage />} />} />
      <Route path="/dashboard/generated/:generationId" element={<ProtectedRoute element={<GeneratedContentPage />} />} />
      <Route path="/dashboard/saved-content" element={<ProtectedRoute element={<SavedContentPage />} />} />
      <Route path="/dashboard/saved-content/:slug" element={<ProtectedRoute element={<SavedContentDetailPage />} />} />
      
      {/* Admin Routes */}
      <Route path="/dashboard/admin/ai-settings" element={<ProtectedRoute element={<AISettingsPage />} adminOnly />} />
      <Route path="/dashboard/admin/prompts" element={<ProtectedRoute element={<PromptsPage />} adminOnly />} />
      <Route path="/dashboard/admin/parameters" element={<ProtectedRoute element={<ParametersPage />} adminOnly />} />
      <Route path="/dashboard/admin/content-settings" element={<ProtectedRoute element={<ContentSettingsPage />} adminOnly />} />
      <Route path="/dashboard/admin/users" element={<ProtectedRoute element={<UserListPage />} adminOnly />} />
      <Route path="/dashboard/admin/users/:userId" element={<ProtectedRoute element={<UserDetailsPage />} adminOnly />} />
      
      {/* Catch all for unknown routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
