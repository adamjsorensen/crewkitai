
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import FinancialDashboard from "./pages/financial/FinancialDashboard";
import JobAnalysis from "./pages/financial/JobAnalysis";
import FinancialReports from "./pages/financial/FinancialReports";
import DataUpload from "./pages/financial/DataUpload";
import ProfilePage from "./pages/profile/ProfilePage";
import BusinessProfilePage from "./pages/profile/BusinessProfilePage";
import PersonalProfilePage from "./pages/profile/PersonalProfilePage";
import SettingsPage from "./pages/profile/SettingsPage";
import AiCoach from "./pages/AiCoach";
import PgCoachPage from "./pages/PgCoachPage"; // New PainterGrowth Coach page
import AiSettingsPage from "./pages/admin/AiSettingsPage";
import FeatureFlagsPage from "./pages/admin/FeatureFlagsPage";
import { useEffect } from "react";
import { prefetchWelcomeContent } from "./hooks/useWelcomeContent";

// Create query client with optimal settings for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch when window regains focus by default
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes by default
      retry: 1, // Only retry once by default
    },
  },
});

// Initial prefetching for commonly used data
const AppContent = () => {
  useEffect(() => {
    // Start prefetching the welcome content as soon as the app loads
    prefetchWelcomeContent(queryClient);
    
    // Additional prefetching can be added here later
  }, []);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/financial" element={<FinancialDashboard />} />
        <Route path="/dashboard/financial/jobs" element={<JobAnalysis />} />
        <Route path="/dashboard/financial/reports" element={<FinancialReports />} />
        <Route path="/dashboard/financial/upload" element={<DataUpload />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/profile/business" element={<BusinessProfilePage />} />
        <Route path="/dashboard/profile/personal" element={<PersonalProfilePage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/ai-coach" element={<AiCoach />} />
        <Route path="/dashboard/pg-coach" element={<PgCoachPage />} />
        
        {/* Admin Routes */}
        <Route path="/dashboard/admin/ai-settings" element={<AiSettingsPage />} />
        <Route path="/dashboard/admin/feature-flags" element={<FeatureFlagsPage />} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FeatureFlagsProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </FeatureFlagsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
