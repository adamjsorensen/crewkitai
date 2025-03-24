
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CompassUserProfile } from '@/types/compass';

export const basicFormSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  business_stage: z.enum(['early', 'growth', 'maturity', 'exit']),
  crew_size: z.enum(['1-3', '4-10', '10+']),
  phone: z.string().optional(),
  full_name: z.string().min(1, 'Full name is required'),
});

export type BasicFormValues = z.infer<typeof basicFormSchema>;

interface BasicFormProps {
  onSubmit: (values: BasicFormValues) => void;
  existingProfile?: CompassUserProfile;
  showSaveButton?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  defaultValues?: Partial<BasicFormValues>;
}

const BasicForm: React.FC<BasicFormProps> = ({
  onSubmit,
  existingProfile,
  showSaveButton = true,
  buttonText = 'Save Profile',
  buttonIcon,
  defaultValues,
}) => {
  const form = useForm<BasicFormValues>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: {
      business_name: existingProfile?.business_name || defaultValues?.business_name || '',
      business_stage: (defaultValues?.business_stage as any) || 'early',
      crew_size: existingProfile?.crew_size || defaultValues?.crew_size || '1-3',
      phone: defaultValues?.phone || '',
      full_name: defaultValues?.full_name || '',
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField 
          control={form.control} 
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
          control={form.control} 
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
          control={form.control} 
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
          control={form.control} 
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
          control={form.control} 
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
  );
};

export default BasicForm;
