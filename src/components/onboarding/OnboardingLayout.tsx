
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { PaintBucket, ArrowLeft, ArrowRight, X } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

const OnboardingProgressBar = () => {
  const { steps, progress, currentStepKey } = useOnboarding();
  
  if (!steps.length || !progress) return null;
  
  const currentStep = steps.find(s => s.step_key === currentStepKey);
  const currentIndex = currentStep ? currentStep.order_index : 1;
  const progressPercentage = (currentIndex / steps.length) * 100;
  
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <span>Step {currentIndex} of {steps.length}</span>
        <span>{Math.round(progressPercentage)}% Complete</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};

const OnboardingNavigation = () => {
  const { 
    steps, 
    currentStepKey, 
    goToNextStep, 
    goToPreviousStep,
    skipOnboarding
  } = useOnboarding();
  const navigate = useNavigate();
  
  const currentStep = steps.find(s => s.step_key === currentStepKey);
  const isFirstStep = currentStep?.order_index === 1;
  const isLastStep = currentStep?.order_index === steps.length;
  
  return (
    <div className="flex justify-between items-center mt-8">
      <div>
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => {
            skipOnboarding();
            navigate('/dashboard');
          }}
          className="text-muted-foreground"
        >
          Skip for now
        </Button>
        
        {isLastStep ? (
          <Button 
            onClick={() => {
              skipOnboarding();
              navigate('/dashboard');
            }}
            className="flex items-center gap-2"
          >
            Finish
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={goToNextStep}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// We wrap everything in OnboardingProvider to avoid needing it in each component
const OnboardingLayoutWithContext: React.FC<OnboardingLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <PaintBucket className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-extrabold tracking-tight">CrewkitAI</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <OnboardingProgressBar />
        
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          {children}
        </div>
        
        <OnboardingNavigation />
      </div>
    </div>
  );
};

// Public component that ensures OnboardingProvider is present
export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children }) => {
  return (
    <OnboardingProvider>
      <OnboardingLayoutWithContext>
        {children}
      </OnboardingLayoutWithContext>
    </OnboardingProvider>
  );
};
