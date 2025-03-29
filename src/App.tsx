
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import AuthPage from "@/pages/auth/AuthPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LandingPage from "@/pages/landing/LandingPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import CompassPage from "@/pages/dashboard/CompassPage";
import PGCoachPage from "@/pages/dashboard/PGCoachPage";
import AISettingsPage from "@/pages/admin/AISettingsPage";
import ContentSettingsPage from "@/pages/admin/ContentSettingsPage";
import UserListPage from "@/pages/admin/UserListPage";
import UserDetailsPage from "@/pages/admin/UserDetailsPage";
import FinancialPage from "@/pages/dashboard/FinancialPage";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

// New content generation related pages
import PromptLibraryPage from "@/pages/dashboard/PromptLibraryPage";
import PromptPage from "@/pages/dashboard/PromptPage";
import GeneratedContentPage from "@/pages/dashboard/GeneratedContentPage";
import SavedContentListPage from "@/pages/dashboard/SavedContentListPage";
import SavedContentPage from "@/pages/dashboard/SavedContentPage";
import PromptManagementPage from "@/pages/admin/PromptManagementPage";
import ParametersManagementPage from "@/pages/admin/ParametersManagementPage";
import GenerationsPage from "@/pages/admin/GenerationsPage";

function App() {
  // Create a client
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="crewkit-ui-theme">
        <AuthProvider>
          <Router>
            <SidebarProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/compass" element={
                  <ProtectedRoute>
                    <CompassPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/pg-coach" element={
                  <ProtectedRoute>
                    <PGCoachPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/ai-coach" element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard/pg-coach" replace />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/financial" element={
                  <ProtectedRoute>
                    <FinancialPage />
                  </ProtectedRoute>
                } />

                {/* Content Generation Routes */}
                <Route path="/dashboard/prompt-library" element={
                  <ProtectedRoute>
                    <PromptLibraryPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/prompt/:promptId" element={
                  <ProtectedRoute>
                    <PromptPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/generated/:generationId" element={
                  <ProtectedRoute>
                    <GeneratedContentPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/saved-content" element={
                  <ProtectedRoute>
                    <SavedContentListPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/saved-content/:slug" element={
                  <ProtectedRoute>
                    <SavedContentPage />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/dashboard/admin/ai-settings" element={
                  <ProtectedRoute adminOnly>
                    <AISettingsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/content-settings" element={
                  <ProtectedRoute adminOnly>
                    <ContentSettingsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/prompts" element={
                  <ProtectedRoute adminOnly>
                    <PromptManagementPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/parameters" element={
                  <ProtectedRoute adminOnly>
                    <ParametersManagementPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard/admin/generations" element={
                  <ProtectedRoute adminOnly>
                    <GenerationsPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/user-management/user-list" element={
                  <ProtectedRoute adminOnly>
                    <UserListPage />
                  </ProtectedRoute>
                } />

                <Route path="/dashboard/user-management/user/:userId" element={
                  <ProtectedRoute adminOnly>
                    <UserDetailsPage />
                  </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SidebarProvider>
          </Router>
        </AuthProvider>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
