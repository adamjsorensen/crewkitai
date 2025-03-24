
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CompassUserProfile } from '@/types/compass';
import { Info, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const basicFormSchema = z.object({
  business_name: z.string()
    .min(1, 'Business name is required')
    .max(100, 'Business name should be less than 100 characters'),
  business_stage: z.enum(['early', 'growth', 'maturity', 'exit']),
  crew_size: z.enum(['1-3', '4-10', '10+']),
  phone: z.string()
    .optional()
    .refine(val => !val || /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(val), {
      message: 'Please enter a valid phone number',
    }),
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
  isAutosaving?: boolean;
}

const HelpTooltip = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1 inline-flex cursor-help">
          <Info className="h-4 w-4 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-80">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const BasicForm: React.FC<BasicFormProps> = ({
  onSubmit,
  existingProfile,
  showSaveButton = true,
  buttonText = 'Save Profile',
  buttonIcon,
  defaultValues,
  isAutosaving = false,
}) => {
  const form = useForm<BasicFormValues>({
    resolver: zodResolver(basicFormSchema),
    defaultValues: {
      business_name: existingProfile?.business_name || defaultValues?.business_name || '',
      business_stage: (defaultValues?.business_stage as any) || 'early',
      crew_size: existingProfile?.crew_size || defaultValues?.crew_size || '1-3',
      phone: defaultValues?.phone || '',
      full_name: defaultValues?.full_name || '',
    },
    mode: 'onChange' // Enable validation on change
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField 
          control={form.control} 
          name="full_name" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Your Name
                <HelpTooltip content="This will be used in communications and your profile" />
              </FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Enter your full name as you'd like to be addressed by CrewkitAI.
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
              <FormLabel className="flex items-center">
                Business Name
                <HelpTooltip content="The name of your painting company or business" />
              </FormLabel>
              <FormControl>
                <Input placeholder="Pro Painters LLC" {...field} />
              </FormControl>
              <FormDescription>
                This will be used to identify your business in reports and communications.
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
              <FormLabel className="flex items-center">
                Business Stage
                <HelpTooltip content="This helps us tailor advice to your business's current needs" />
              </FormLabel>
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
                Which stage best describes your annual revenue range?
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
              <FormLabel className="flex items-center">
                Crew Size
                <HelpTooltip content="Helps tailor task management to your team size" />
              </FormLabel>
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
              <FormDescription>
                How many full-time painters do you currently employ?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="phone" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Phone Number
                <HelpTooltip content="Used for optional SMS notifications and reminders" />
              </FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} />
              </FormControl>
              <FormDescription>
                Your business phone number (optional). Format: (123) 456-7890
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showSaveButton && (
          <div className="flex items-center justify-between">
            <div>
              {isAutosaving && (
                <span className="text-sm text-muted-foreground">
                  Auto-saving your progress...
                </span>
              )}
            </div>
            <Button type="submit" className="flex items-center justify-center gap-2">
              {buttonText}
              {buttonIcon || <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default BasicForm;
