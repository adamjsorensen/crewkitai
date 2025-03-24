
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompassUserProfile } from '@/types/compass';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import BasicForm, { BasicFormValues } from './onboarding/BasicForm';
import DetailsForm, { DetailsFormValues } from './onboarding/DetailsForm';
import { saveBasicFormData, saveDetailsFormData, loadProfileData } from './onboarding/OnboardingUtils';

interface CompassOnboardingProps {
  onComplete: (profile: CompassUserProfile) => void;
  existingProfile?: CompassUserProfile;
  formMode?: 'basic' | 'details' | 'full';
  showSaveButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
}

const CompassOnboarding: React.FC<CompassOnboardingProps> = ({
  onComplete,
  existingProfile,
  formMode = 'full',
  showSaveButton = true,
  showBackButton = false,
  onBackClick,
  buttonText = 'Save Profile',
  buttonIcon,
}) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [basicValues, setBasicValues] = useState<Partial<BasicFormValues>>({
    full_name: profile?.full_name || '',
  });
  const [detailsValues, setDetailsValues] = useState<Partial<DetailsFormValues>>({});

  useEffect(() => {
    if (user) {
      loadProfileData(user.id, setBasicValues, setDetailsValues);
    }
  }, [user]);

  const handleBasicSubmit = async (values: BasicFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue.",
        variant: "destructive"
      });
      return;
    }

    const result = await saveBasicFormData(values, user.id, toast);
    
    if (result && formMode === 'basic') {
      onComplete(result);
    }
  };

  const handleDetailsSubmit = async (values: DetailsFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue.",
        variant: "destructive"
      });
      return;
    }

    const result = await saveDetailsFormData(values, user.id, toast);
    
    if (result) {
      onComplete(result);
    }
  };

  const renderBasicForm = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Basic Business Information</CardTitle>
        <CardDescription>
          Tell us about your painting business so we can better prioritize your tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BasicForm
          onSubmit={handleBasicSubmit}
          existingProfile={existingProfile}
          showSaveButton={showSaveButton}
          buttonText={buttonText}
          buttonIcon={buttonIcon}
          defaultValues={basicValues}
        />
      </CardContent>
    </Card>
  );

  const renderDetailsForm = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Additional Business Details</CardTitle>
        <CardDescription>
          Tell us more about your painting business to help us personalize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DetailsForm
          onSubmit={handleDetailsSubmit}
          existingProfile={existingProfile}
          showBackButton={showBackButton}
          onBackClick={onBackClick}
          buttonText={buttonText}
          defaultValues={detailsValues}
        />
      </CardContent>
    </Card>
  );

  if (formMode === 'basic') {
    return renderBasicForm();
  } else if (formMode === 'details') {
    return renderDetailsForm();
  } else {
    return (
      <div className="space-y-8">
        {renderBasicForm()}
        {renderDetailsForm()}
      </div>
    );
  }
};

export default CompassOnboarding;
