
import { supabase } from '@/integrations/supabase/client';
import { CompassUserProfile } from '@/types/compass';
import { BasicFormValues } from './BasicForm';
import { DetailsFormValues } from './DetailsForm';
import { useToast } from '@/hooks/use-toast';

export const saveBasicFormData = async (
  values: BasicFormValues, 
  userId: string, 
  toast: ReturnType<typeof useToast>['toast']
): Promise<CompassUserProfile | null> => {
  try {
    let workload: 'High' | 'Medium' | 'Low' = 'Medium';
    switch (values.business_stage) {
      case 'early': workload = 'Low'; break;
      case 'growth': workload = 'Medium'; break;
      case 'maturity': 
      case 'exit': workload = 'High'; break;
    }
    
    // Check if profile exists first
    const { data: existingProfile, error: checkError } = await supabase
      .from('compass_user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    // Use upsert with different approach based on whether profile exists
    const { data: compassData, error: compassError } = await supabase
      .from('compass_user_profiles')
      .upsert({
        id: userId,
        business_name: values.business_name,
        crew_size: values.crew_size,
        workload,
        // Preserve existing specialties if any
        ...(existingProfile && existingProfile.specialties && {
          specialties: existingProfile.specialties
        })
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
    
    // Only show toast on explicit saves, not auto-saves
    if (toast) {
      toast({
        title: "Success!",
        description: "Your profile has been saved."
      });
    }
    
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
  toast: ReturnType<typeof useToast>['toast']
): Promise<CompassUserProfile | null> => {
  try {
    // Check if compass profile exists first
    const { data: existingCompassProfile } = await supabase
      .from('compass_user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    // Prepare data with existing values for any undefined fields
    const compassProfileData = {
      id: userId,
      specialties: values.specialties,
      workload: values.workload,
      // Preserve these fields if they exist
      ...(existingCompassProfile?.business_name && { 
        business_name: existingCompassProfile.business_name 
      }),
      ...(existingCompassProfile?.crew_size && { 
        crew_size: existingCompassProfile.crew_size 
      }),
    };
      
    const { data: compassData, error: compassError } = await supabase
      .from('compass_user_profiles')
      .upsert(compassProfileData, { onConflict: 'id' })
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
    
    // Get existing profile data to preserve fields
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
        // Preserve these fields if they exist
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
    
    // Only show toast on explicit saves, not auto-saves
    if (toast) {
      toast({
        title: "Success!",
        description: "Your profile has been saved."
      });
    }
    
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
    // Load general profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return;
    }
    
    // Load compass-specific profile data
    const { data: compassData, error: compassError } = await supabase
      .from('compass_user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (compassError && compassError.code !== 'PGRST116') {
      console.error('Error fetching compass profile:', compassError);
      return;
    }
    
    // Set basic values from both profile sources
    if (profileData || compassData) {
      setBasicValues({
        business_name: compassData?.business_name || profileData?.company_name || '',
        phone: profileData?.phone || '',
        full_name: profileData?.full_name || '',
        crew_size: compassData?.crew_size || '1-3',
        // Infer business stage from workload if possible
        ...(compassData?.workload && {
          business_stage: 
            compassData.workload === 'Low' ? 'early' :
            compassData.workload === 'Medium' ? 'growth' : 'maturity'
        }),
      });
    }
    
    // Set details values
    if (profileData || compassData) {
      setDetailsValues({
        business_address: profileData?.business_address || '',
        company_description: profileData?.company_description || '',
        website: profileData?.website || '',
        specialties: compassData?.specialties || [],
        workload: compassData?.workload || 'Medium',
      });
    }
    
  } catch (err) {
    console.error('Error loading profile data:', err);
  }
};
