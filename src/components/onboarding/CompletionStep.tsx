
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Check, PaintBucket, ArrowRight } from 'lucide-react';

export const CompletionStep = () => {
  const { completeStep } = useOnboarding();
  const navigate = useNavigate();
  
  const handleComplete = () => {
    completeStep('completion');
    navigate('/dashboard');
  };
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        You're All Set!
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        Thanks for completing the onboarding process. Your CrewkitAI is now configured and ready to help your painting business succeed.
      </p>
      
      <div className="bg-slate-50 border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <PaintBucket className="h-6 w-6 text-primary" />
          <h3 className="font-bold text-lg">What's next?</h3>
        </div>
        
        <p className="text-center mb-4">
          Head to your dashboard to start exploring all the features CrewkitAI has to offer.
        </p>
        
        <ul className="space-y-3 max-w-md mx-auto">
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Organize your tasks with Strategic Compass</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Get business advice from your AI Coach</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Track your financial performance</span>
          </li>
          <li className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <span>Generate professional content for your business</span>
          </li>
        </ul>
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          size="lg"
          className="flex items-center gap-2"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
