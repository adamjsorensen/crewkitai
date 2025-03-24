import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FeatureFlagsProvider } from "./contexts/FeatureFlagsContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import OnboardingPage from "./pages/OnboardingPage";
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
import PgCoachPage from "./pages/PgCoachPage"; // PainterGrowth Coach page
import CompassPage from "./pages/CompassPage"; // Strategic Planner page
import AiSettingsPage from "./pages/admin/AiSettingsPage";
import FeatureFlagsPage from "./pages/admin/FeatureFlagsPage";
import CompassSettingsPage from "./pages/admin/CompassSettingsPage"; // CompassSettingsPage import
import UsersPage from "./pages/admin/UsersPage"; // New Users page import
import ContentPage from "./pages/content/ContentPage"; // New Content page
import { useEffect } from "react";
import { prefetchWelcomeContent } from "./hooks/useWelcomeContent";
import { useNeedsOnboarding } from "./hooks/useNeedsOnboarding";

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
const AuthenticatedRoute = ({ element }: { element: React.ReactNode }) => {
  const { needsOnboarding, isLoading } = useNeedsOnboarding();
  
  // If still loading, render nothing (or a loader)
  if (isLoading) {
    return null;
  }
  
  // If user needs onboarding, redirect to onboarding
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Otherwise, render the protected component
  return <>{element}</>;
};

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
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<AuthenticatedRoute element={<Dashboard />} />} />
        <Route path="/dashboard/content" element={<AuthenticatedRoute element={<ContentPage />} />} />
        <Route path="/dashboard/financial" element={<AuthenticatedRoute element={<FinancialDashboard />} />} />
        <Route path="/dashboard/financial/jobs" element={<AuthenticatedRoute element={<JobAnalysis />} />} />
        <Route path="/dashboard/financial/reports" element={<AuthenticatedRoute element={<FinancialReports />} />} />
        <Route path="/dashboard/financial/upload" element={<AuthenticatedRoute element={<DataUpload />} />} />
        <Route path="/dashboard/profile" element={<AuthenticatedRoute element={<ProfilePage />} />} />
        <Route path="/dashboard/profile/business" element={<AuthenticatedRoute element={<BusinessProfilePage />} />} />
        <Route path="/dashboard/profile/personal" element={<AuthenticatedRoute element={<PersonalProfilePage />} />} />
        <Route path="/dashboard/settings" element={<AuthenticatedRoute element={<SettingsPage />} />} />
        <Route path="/dashboard/ai-coach" element={<AuthenticatedRoute element={<AiCoach />} />} />
        <Route path="/dashboard/pg-coach" element={<AuthenticatedRoute element={<PgCoachPage />} />} />
        <Route path="/dashboard/compass" element={<AuthenticatedRoute element={<CompassPage />} />} />
        
        {/* Admin Routes */}
        <Route path="/dashboard/admin/ai-settings" element={<AuthenticatedRoute element={<AiSettingsPage />} />} />
        <Route path="/dashboard/admin/feature-flags" element={<AuthenticatedRoute element={<FeatureFlagsPage />} />} />
        <Route path="/dashboard/admin/compass-settings" element={<AuthenticatedRoute element={<CompassSettingsPage />} />} />
        <Route path="/dashboard/admin/users" element={<AuthenticatedRoute element={<UsersPage />} />} />
        
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
          <OnboardingProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </OnboardingProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
