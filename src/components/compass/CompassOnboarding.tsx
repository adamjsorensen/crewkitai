import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CompassUserProfile } from '@/types/compass';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

const basicFormSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  business_stage: z.enum(['early', 'growth', 'maturity', 'exit']),
  crew_size: z.enum(['1-3', '4-10', '10+']),
  phone: z.string().optional(),
  full_name: z.string().min(1, 'Full name is required'),
});

const detailsFormSchema = z.object({
  business_address: z.string().optional(),
  company_description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.string().length(0)),
  specialties: z.array(z.string()).min(1, 'Select at least one specialty'),
  workload: z.enum(['High', 'Medium', 'Low']).optional(),
});

type BasicFormValues = z.infer<typeof basicFormSchema>;
type DetailsFormValues = z.infer<typeof detailsFormSchema>;

const specialtiesOptions = [{
  id: 'residential',
  label: 'Residential'
}, {
  id: 'commercial',
  label: 'Commercial'
}, {
  id: 'interior',
  label: 'Interior'
}, {
  id: 'exterior',
  label: 'Exterior'
}, {
  id: 'industrial',
  label: 'Industrial'
}, {
  id: 'new-construction',
  label: 'New Construction'
}, {
  id: 'renovation',
  label: 'Renovation'
}];

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
  
  const basicForm = useForm<BasicFormValues>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: {
      business_name: existingProfile?.business_name || '',
      business_stage: (existingProfile?.workload as any) || 'early',
      crew_size: existingProfile?.crew_size || '1-3',
      phone: '',
      full_name: profile?.full_name || '',
    }
  });
  
  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      business_address: '',
      company_description: '',
      website: '',
      specialties: existingProfile?.specialties || [],
      workload: existingProfile?.workload || 'Medium',
    }
  });

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        if (profileData) {
          basicForm.setValue('business_name', profileData.company_name || '');
          basicForm.setValue('phone', profileData.phone || '');
          basicForm.setValue('full_name', profileData.full_name || '');
          
          detailsForm.setValue('business_address', profileData.business_address || '');
          detailsForm.setValue('company_description', profileData.company_description || '');
          detailsForm.setValue('website', profileData.website || '');
        }
        
      } catch (err) {
        console.error('Error loading profile data:', err);
      }
    };
    
    loadProfileData();
  }, [user, basicForm, detailsForm]);
  
  const onSubmitBasic = async (values: BasicFormValues) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }
      
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
          id: user.id,
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
        return;
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
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
        return;
      }
      
      toast({
        title: "Success!",
        description: "Your profile has been saved."
      });
      
      if (formMode === 'basic' && compassData) {
        onComplete(compassData as CompassUserProfile);
      }
      
    } catch (err) {
      console.error('Error in form submission:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const onSubmitDetails = async (values: DetailsFormValues) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }
      
      const { data: compassData, error: compassError } = await supabase
        .from('compass_user_profiles')
        .upsert({
          id: user.id,
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
        return;
      }
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('company_name, full_name')
        .eq('id', user.id)
        .single();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          business_address: values.business_address,
          company_description: values.company_description,
          website: values.website,
          company_name: existingProfile?.company_name || '',
          full_name: existingProfile?.full_name || profile?.full_name || '',
        }, { onConflict: 'id' });
        
      if (profileError) {
        console.error('Error saving general profile:', profileError);
        toast({
          title: "Error",
          description: "Failed to save your profile. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Success!",
        description: "Your profile has been saved."
      });
      
      if (compassData) {
        onComplete(compassData as CompassUserProfile);
      }
      
    } catch (err) {
      console.error('Error in form submission:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
        <Form {...basicForm}>
          <form onSubmit={basicForm.handleSubmit(onSubmitBasic)} className="space-y-6">
            <FormField 
              control={basicForm.control} 
              name="full_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your full name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={basicForm.control} 
              name="business_name" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pro Painters LLC" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the name of your painting business.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={basicForm.control} 
              name="business_stage" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="early">Early Stage ($0-500k/yr)</SelectItem>
                      <SelectItem value="growth">Growth Stage ($500k-2m/yr)</SelectItem>
                      <SelectItem value="maturity">Maturity Stage ($2m-5m/yr)</SelectItem>
                      <SelectItem value="exit">Exit Stage ($5m+/yr)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What is your estimated annual revenue?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={basicForm.control} 
              name="crew_size" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crew Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your crew size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 People</SelectItem>
                      <SelectItem value="4-10">4-10 People</SelectItem>
                      <SelectItem value="10+">10+ People</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>How many full time painters do you have?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={basicForm.control} 
              name="phone" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your business phone number (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showSaveButton && (
              <Button type="submit" className="w-full flex items-center justify-center gap-2">
                {buttonText}
                {buttonIcon}
              </Button>
            )}
          </form>
        </Form>
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
        <Form {...detailsForm}>
          <form onSubmit={detailsForm.handleSubmit(onSubmitDetails)} className="space-y-6">
            <FormField 
              control={detailsForm.control} 
              name="business_address" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Anytown, USA" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your business address (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={detailsForm.control} 
              name="company_description" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="We specialize in high-quality residential and commercial painting..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of your painting business (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={detailsForm.control} 
              name="website" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourcompany.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your business website URL (optional).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField 
              control={detailsForm.control} 
              name="specialties" 
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Specialties</FormLabel>
                    <FormDescription>
                      Select the types of painting services you offer.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {specialtiesOptions.map(specialty => (
                      <FormField
                        key={specialty.id}
                        control={detailsForm.control}
                        name="specialties"
                        render={({ field }) => {
                          return (
                            <FormItem key={specialty.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(specialty.id)}
                                  onCheckedChange={(checked) => {
                                    const updatedSpecialties = checked
                                      ? [...field.value, specialty.id]
                                      : field.value?.filter(value => value !== specialty.id);
                                    field.onChange(updatedSpecialties);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {specialty.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between items-center pt-2">
              {showBackButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackClick}
                  className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Basic Info
                </Button>
              )}
              
              <Button 
                type="submit" 
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {buttonText}
              </Button>
            </div>
          </form>
        </Form>
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
