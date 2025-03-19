
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
