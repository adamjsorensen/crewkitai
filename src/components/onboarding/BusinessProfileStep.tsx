
import React, { useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import CompassOnboarding from '@/components/compass/CompassOnboarding';
import { CompassUserProfile } from '@/types/compass';
import { Building2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const BusinessProfileStep = () => {
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  
  const handleProfileComplete = (profile: CompassUserProfile) => {
    // When the profile is completed, move to the next step
    completeStep('business_profile');
  };
  
  const goToNextTab = () => {
    setActiveTab('details');
  };
  
  const goToPreviousTab = () => {
    setActiveTab('basic');
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Additional Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <CompassOnboarding 
            onComplete={(profile) => {
              toast({
                title: "Information saved",
                description: "Your basic information has been saved. Let's add some additional details."
              });
              goToNextTab();
            }}
            existingProfile={undefined}
            formMode="basic"
            showSaveButton={true}
            buttonText="Continue to Additional Details"
            buttonIcon={<ArrowRight className="h-4 w-4" />}
          />
        </TabsContent>
        
        <TabsContent value="details">
          <CompassOnboarding 
            onComplete={handleProfileComplete}
            existingProfile={undefined}
            formMode="details"
            showBackButton={true}
            onBackClick={goToPreviousTab}
            buttonText="Complete Profile"
          />
        </TabsContent>
      </Tabs>
      
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
