
import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './providers/ThemeProvider';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import FinancialPage from './pages/FinancialPage';
import CompassPage from './pages/CompassPage';
import ContentPage from './pages/ContentPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminAiSettingsPage from './pages/admin/AdminAiSettingsPage';
import PgCoachPage from './pages/PgCoachPage';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { LoadingScreen } from './components/ui/loading-screen';
import { useAuth } from './contexts/AuthContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="crewkit-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/dashboard/content" element={<PrivateRoute><ContentPage /></PrivateRoute>} />
                <Route path="/dashboard/financial" element={<PrivateRoute><FinancialPage /></PrivateRoute>} />
                <Route path="/dashboard/pg-coach" element={<PrivateRoute><PgCoachPage /></PrivateRoute>} />
                <Route path="/dashboard/compass" element={<PrivateRoute><CompassPage /></PrivateRoute>} />
                <Route path="/dashboard/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/dashboard/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                
                {/* Admin Routes */}
                <Route path="/dashboard/admin/ai-settings" element={<AdminRoute><AdminAiSettingsPage /></AdminRoute>} />
                
                {/* Redirect from root to dashboard */}
                <Route path="/" element={<RedirectToDashboard />} />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

// Helper component to redirect users based on auth status
function RedirectToDashboard() {
  const { user, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // Only show loading for a reasonable time to avoid flash
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading || showLoading) {
    return <LoadingScreen />;
  }
  
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}

export default App;
