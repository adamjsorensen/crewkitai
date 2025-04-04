
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import Index from "@/pages/Index";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import CompassPage from "@/pages/CompassPage";
import PgCoachPage from "@/pages/PgCoachPage";
import ContentPage from "@/pages/content/ContentPage";
import FinancialPage from "@/pages/financial/FinancialDashboard";
import ProfilePage from "@/pages/profile/ProfilePage";
import BusinessProfilePage from "@/pages/profile/BusinessProfilePage";
import PersonalProfilePage from "@/pages/profile/PersonalProfilePage";
import SettingsPage from "@/pages/profile/SettingsPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AISettingsPage from "@/pages/admin/AiSettingsPage";
import CompassSettingsPage from "@/pages/admin/CompassSettingsPage";
import ContentSettingsPage from "@/pages/admin/ContentSettingsPage";
import FeatureFlagsPage from "@/pages/admin/FeatureFlagsPage";
import AppSettingsPage from "@/pages/admin/AppSettingsPage";
import DatabasePage from "@/pages/admin/DatabasePage";
import PromptsPage from "@/pages/admin/PromptsPage";
import ParametersPage from "@/pages/admin/ParametersPage";
import GenerationsLogPage from "@/pages/admin/GenerationsLogPage";
import UsersPage from "@/pages/admin/UsersPage";
import AdminUserDetailsPage from "@/pages/admin/users/AdminUserDetailsPage";
import AdminActivityLogsPage from "@/pages/admin/ActivityLogsPage";
import GeneratedContentPage from "@/pages/content/GeneratedContentPage";
import SavedContentPage from "@/pages/content/SavedContentPage";
import SavedContentDetailPage from "@/pages/content/SavedContentDetailPage";
import { setupGraphlitCollections, isGraphlitAvailable } from "@/services/graphlitService";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    const initializeRag = async () => {
      try {
        const available = await isGraphlitAvailable();
        
        if (available) {
          console.log('Initializing Graphlit RAG collections...');
          const result = await setupGraphlitCollections();
          console.log('Graphlit RAG initialization result:', result);
        } else {
          console.log('Graphlit RAG system not available, skipping initialization');
        }
      } catch (error) {
        console.error('Error initializing Graphlit RAG:', error);
      }
    };
    
    initializeRag();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/compass" element={<CompassPage />} />
              <Route path="/dashboard/pg-coach" element={<PgCoachPage />} />
              <Route path="/dashboard/content" element={<ContentPage />} />
              <Route path="/dashboard/financial" element={<FinancialPage />} />
              <Route path="/dashboard/profile" element={<ProfilePage />} />
              <Route path="/dashboard/profile/business" element={<BusinessProfilePage />} />
              <Route path="/dashboard/profile/personal" element={<PersonalProfilePage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
              
              <Route path="/dashboard/prompt-library" element={<Navigate to="/dashboard/content" replace />} />
              <Route path="/dashboard/generated/:id" element={<GeneratedContentPage />} />
              <Route path="/dashboard/saved-content" element={<SavedContentPage />} />
              <Route path="/dashboard/saved-content/:slug" element={<SavedContentDetailPage />} />
              
              <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
              <Route path="/dashboard/admin/ai-settings" element={<AISettingsPage />} />
              <Route path="/dashboard/admin/compass-settings" element={<CompassSettingsPage />} />
              <Route path="/dashboard/admin/content-settings" element={<ContentSettingsPage />} />
              <Route path="/dashboard/admin/prompts" element={<PromptsPage />} />
              <Route path="/dashboard/admin/parameters" element={<ParametersPage />} />
              <Route path="/dashboard/admin/generations" element={<GenerationsLogPage />} />
              <Route path="/dashboard/admin/feature-flags" element={<FeatureFlagsPage />} />
              <Route path="/dashboard/admin/app-settings" element={<AppSettingsPage />} />
              <Route path="/dashboard/admin/database" element={<DatabasePage />} />
              <Route path="/dashboard/admin/users" element={<UsersPage />} />
              <Route path="/dashboard/admin/users/:userId" element={<AdminUserDetailsPage />} />
              <Route path="/dashboard/admin/activity-logs" element={<AdminActivityLogsPage />} />
              
              <Route path="/dashboard/ai-coach" element={<Navigate to="/dashboard/pg-coach" replace />} />
            </Routes>
          </Router>
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
