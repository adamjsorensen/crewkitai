
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { BusinessProfileStep } from '@/components/onboarding/BusinessProfileStep';
import { FeatureTourStep } from '@/components/onboarding/FeatureTourStep';
import { CompassIntroStep } from '@/components/onboarding/CompassIntroStep';
import { AiCoachIntroStep } from '@/components/onboarding/AiCoachIntroStep';
import { CompletionStep } from '@/components/onboarding/CompletionStep';
import { Loader2 } from 'lucide-react';

const StepSelector = () => {
  const { currentStepKey } = useOnboarding();
  
  // Render the correct component based on the current step
  switch (currentStepKey) {
    case 'welcome':
      return <WelcomeStep />;
    case 'business_profile':
      return <BusinessProfileStep />;
    case 'feature_tour':
      return <FeatureTourStep />;
    case 'compass_intro':
      return <CompassIntroStep />;
    case 'ai_coach_intro':
      return <AiCoachIntroStep />;
    case 'completion':
      return <CompletionStep />;
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
