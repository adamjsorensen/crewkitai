
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { Loader2 } from 'lucide-react';

const StepSelector = () => {
  const { currentStepKey } = useOnboarding();
  
  // Render the correct component based on the current step
  switch (currentStepKey) {
    case 'welcome':
      return <WelcomeStep />;
    // Additional steps will be added here as we implement them
    default:
      return <div>Step not found</div>;
  }
};

const OnboardingPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: onboardingLoading, isCompleted } = useOnboarding();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If not logged in, redirect to auth page
    if (!authLoading && !user) {
      navigate('/auth');
    }
    
    // If onboarding is completed, redirect to dashboard
    if (!onboardingLoading && isCompleted) {
      navigate('/dashboard');
    }
  }, [user, authLoading, isCompleted, onboardingLoading, navigate]);
  
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  return (
    <OnboardingLayout>
      <StepSelector />
    </OnboardingLayout>
  );
};

export default OnboardingPage;
