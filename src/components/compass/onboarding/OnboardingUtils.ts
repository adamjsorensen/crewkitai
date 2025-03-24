
import { supabase } from '@/integrations/supabase/client';
import { CompassUserProfile } from '@/types/compass';
import { BasicFormValues } from './BasicForm';
import { DetailsFormValues } from './DetailsForm';
import { UseToastReturn } from '@/hooks/use-toast';

export const saveBasicFormData = async (
  values: BasicFormValues, 
  userId: string, 
  toast: UseToastReturn['toast']
): Promise<CompassUserProfile | null> => {
  try {
    let workload: 'High' | 'Medium' | 'Low' = 'Medium';
    switch (values.business_stage) {
      case 'early': workload = 'Low'; break;
      case 'growth': workload = 'Medium'; break;
      case 'maturity': 
      case 'exit': workload = 'High'; break;
    }
    
    const { data: compassData, error: compassError } = await supabase
      .from('compass_user_profiles')
      .upsert({
        id: userId,
        business_name: values.business_name,
        crew_size: values.crew_size,
        workload,
      }, { onConflict: 'id' })
      .select('*')
      .single();
      
    if (compassError) {
      console.error('Error saving compass profile:', compassError);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
      return null;
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        company_name: values.business_name,
        phone: values.phone,
        full_name: values.full_name,
      }, { onConflict: 'id' });
      
    if (profileError) {
      console.error('Error saving general profile:', profileError);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
      return null;
    }
    
    toast({
      title: "Success!",
      description: "Your profile has been saved."
    });
    
    return compassData as CompassUserProfile;
  } catch (err) {
    console.error('Error in form submission:', err);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
    return null;
  }
};

export const saveDetailsFormData = async (
  values: DetailsFormValues, 
  userId: string, 
  toast: UseToastReturn['toast']
): Promise<CompassUserProfile | null> => {
  try {
    const { data: compassData, error: compassError } = await supabase
      .from('compass_user_profiles')
      .upsert({
        id: userId,
        specialties: values.specialties,
        workload: values.workload,
      }, { onConflict: 'id' })
      .select('*')
      .single();
      
    if (compassError) {
      console.error('Error saving compass profile:', compassError);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
      return null;
    }
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('company_name, full_name')
      .eq('id', userId)
      .single();
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        business_address: values.business_address,
        company_description: values.company_description,
        website: values.website,
        company_name: existingProfile?.company_name || '',
        full_name: existingProfile?.full_name || '',
      }, { onConflict: 'id' });
      
    if (profileError) {
      console.error('Error saving general profile:', profileError);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
      return null;
    }
    
    toast({
      title: "Success!",
      description: "Your profile has been saved."
    });
    
    return compassData as CompassUserProfile;
  } catch (err) {
    console.error('Error in form submission:', err);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
    return null;
  }
};

export const loadProfileData = async (userId: string, setBasicValues: (values: Partial<BasicFormValues>) => void, setDetailsValues: (values: Partial<DetailsFormValues>) => void) => {
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    if (profileData) {
      setBasicValues({
        business_name: profileData.company_name || '',
        phone: profileData.phone || '',
        full_name: profileData.full_name || '',
      });
      
      setDetailsValues({
        business_address: profileData.business_address || '',
        company_description: profileData.company_description || '',
        website: profileData.website || '',
      });
    }
    
  } catch (err) {
    console.error('Error loading profile data:', err);
  }
};
