
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CompassUserProfile } from '@/types/compass';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import BasicForm, { BasicFormValues } from './onboarding/BasicForm';
import DetailsForm, { DetailsFormValues } from './onboarding/DetailsForm';
import { saveBasicFormData, saveDetailsFormData, loadProfileData } from './onboarding/OnboardingUtils';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';

interface CompassOnboardingProps {
  onComplete: (profile: CompassUserProfile) => void;
  existingProfile?: CompassUserProfile;
  formMode?: 'basic' | 'details' | 'full';
  showSaveButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  enableAutoSave?: boolean;
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
  enableAutoSave = true,
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

  // Auto-save for basic form
  const { isSaving: isSavingBasic } = useFormAutoSave({
    values: basicValues,
    onSave: async (values) => {
      if (!user || Object.keys(values).length === 0) return null;
      // Only auto-save if we have at least business_name or full_name
      if (!values.business_name && !values.full_name) return null;
      
      return await saveBasicFormData(values as BasicFormValues, user.id, toast);
    },
    enableAutoSave: enableAutoSave && formMode !== 'details',
    saveMessage: "Profile information saved",
    debounceMs: 3000,
  });

  // Auto-save for details form
  const { isSaving: isSavingDetails } = useFormAutoSave({
    values: detailsValues,
    onSave: async (values) => {
      if (!user || Object.keys(values).length === 0) return null;
      // Only auto-save if we have at least specialties
      if (!values.specialties || values.specialties.length === 0) return null;
      
      return await saveDetailsFormData(values as DetailsFormValues, user.id, toast);
    },
    enableAutoSave: enableAutoSave && formMode !== 'basic',
    saveMessage: "Additional details saved",
    debounceMs: 3000,
  });

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
          isAutosaving={isSavingBasic}
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
          isAutosaving={isSavingDetails}
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
