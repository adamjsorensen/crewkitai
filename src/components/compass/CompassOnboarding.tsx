import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CompassUserProfile } from '@/types/compass';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';

// Define the form schema with Zod
const formSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  crew_size: z.enum(['1-3', '4-10', '10+']),
  specialties: z.array(z.string()).min(1, 'Select at least one specialty'),
  workload: z.enum(['High', 'Medium', 'Low'])
});
type CompassOnboardingFormValues = z.infer<typeof formSchema>;

// Define the specialties options
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
}
const CompassOnboarding: React.FC<CompassOnboardingProps> = ({
  onComplete,
  existingProfile
}) => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  // Initialize the form with default values or existing profile data
  const form = useForm<CompassOnboardingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      business_name: existingProfile?.business_name || '',
      crew_size: existingProfile?.crew_size || '1-3',
      specialties: existingProfile?.specialties || [],
      workload: existingProfile?.workload || 'Medium'
    }
  });
  const onSubmit = async (values: CompassOnboardingFormValues) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }
      const {
        data,
        error
      } = await supabase.from('compass_user_profiles').upsert({
        id: user.id,
        ...values
      }, {
        onConflict: 'id'
      }).select('*').single();
      if (error) {
        console.error('Error saving profile:', error);
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

      // Notify parent component of completion
      onComplete(data as CompassUserProfile);
    } catch (err) {
      console.error('Error in form submission:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };
  return <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Tell us about your painting business so we can better prioritize your tasks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="business_name" render={({
            field
          }) => <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Pro Painters LLC" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the name of your painting business.
                  </FormDescription>
                  <FormMessage />
                </FormItem>} />
            
            <FormField control={form.control} name="crew_size" render={({
            field
          }) => <FormItem>
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
                </FormItem>} />
            
            <FormField control={form.control} name="specialties" render={() => <FormItem>
                  <div className="mb-4">
                    <FormLabel>Specialties</FormLabel>
                    <FormDescription>
                      Select the types of painting services you offer.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {specialtiesOptions.map(specialty => <FormField key={specialty.id} control={form.control} name="specialties" render={({
                field
              }) => {
                return <FormItem key={specialty.id} className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value?.includes(specialty.id)} onCheckedChange={checked => {
                      const updatedSpecialties = checked ? [...field.value, specialty.id] : field.value?.filter(value => value !== specialty.id);
                      field.onChange(updatedSpecialties);
                    }} />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {specialty.label}
                              </FormLabel>
                            </FormItem>;
              }} />)}
                  </div>
                  <FormMessage />
                </FormItem>} />
            
            <FormField control={form.control} name="workload" render={({
            field
          }) => <FormItem>
                  <FormLabel>Current Workload</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your current workload" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Low">Low - Looking for more jobs</SelectItem>
                      <SelectItem value="Medium">Medium - Steady workflow</SelectItem>
                      <SelectItem value="High">High - Very busy</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How busy is your business right now?
                  </FormDescription>
                  <FormMessage />
                </FormItem>} />
            
            <Button type="submit" className="w-full">
              Save Profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>;
};
export default CompassOnboarding;