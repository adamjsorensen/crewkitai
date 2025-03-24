
import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import CompassOnboarding from '@/components/compass/CompassOnboarding';
import { CompassUserProfile } from '@/types/compass';
import { Building2 } from 'lucide-react';

export const BusinessProfileStep = () => {
  const { completeStep } = useOnboarding();
  
  const handleProfileComplete = (profile: CompassUserProfile) => {
    // When the profile is completed, move to the next step
    completeStep('business_profile');
  };
  
  return (
    <div className="py-6">
      <div className="flex justify-center mb-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
      </div>
      
      <h1 className="text-3xl font-extrabold tracking-tight text-center mb-2">
        Tell Us About Your Business
      </h1>
      
      <p className="text-center text-muted-foreground mb-8 max-w-lg mx-auto">
        Help us understand your painting business so we can tailor the experience to your specific needs.
      </p>
      
      <CompassOnboarding 
        onComplete={handleProfileComplete} 
        existingProfile={undefined}
      />
      
      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          onClick={() => completeStep('business_profile')}
          className="text-muted-foreground"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
};
