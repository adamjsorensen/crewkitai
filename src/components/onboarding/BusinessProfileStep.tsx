
import React, { useState, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import CompassOnboarding from '@/components/compass/CompassOnboarding';
import { CompassUserProfile } from '@/types/compass';
import { ArrowRight, ArrowLeft, Building2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const BusinessProfileStep = () => {
  const { completeStep } = useOnboarding();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<CompassUserProfile | undefined>(undefined);
  
  useEffect(() => {
    // Load existing profile data when component mounts
    const loadExistingProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('compass_user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }
        
        if (data) {
          setExistingProfile(data as CompassUserProfile);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadExistingProfile();
  }, [user]);
  
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
              setExistingProfile(profile);
              toast({
                title: "Information saved",
                description: "Your basic information has been saved. Let's add some additional details."
              });
              goToNextTab();
            }}
            existingProfile={existingProfile}
            formMode="basic"
            showSaveButton={true}
            buttonText="Continue to Additional Details"
            buttonIcon={<ArrowRight className="h-4 w-4" />}
            enableAutoSave={true}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Your progress is automatically saved as you type</p>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <CompassOnboarding 
            onComplete={handleProfileComplete}
            existingProfile={existingProfile}
            formMode="details"
            showBackButton={true}
            onBackClick={goToPreviousTab}
            buttonText="Complete Profile"
            enableAutoSave={true}
          />
          
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Your progress is automatically saved as you type</p>
          </div>
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
