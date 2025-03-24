
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { CompassUserProfile } from '@/types/compass';
import { ArrowLeft, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const detailsFormSchema = z.object({
  business_address: z.string().optional(),
  company_description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.string().length(0)),
  specialties: z.array(z.string()).min(1, 'Select at least one specialty'),
  workload: z.enum(['High', 'Medium', 'Low']).optional(),
});

export type DetailsFormValues = z.infer<typeof detailsFormSchema>;

export const specialtiesOptions = [{
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

interface DetailsFormProps {
  onSubmit: (values: DetailsFormValues) => void;
  existingProfile?: CompassUserProfile;
  showBackButton?: boolean;
  onBackClick?: () => void;
  buttonText?: string;
  defaultValues?: Partial<DetailsFormValues>;
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

const DetailsForm: React.FC<DetailsFormProps> = ({
  onSubmit,
  existingProfile,
  showBackButton = false,
  onBackClick,
  buttonText = 'Save Profile',
  defaultValues,
  isAutosaving = false,
}) => {
  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      business_address: defaultValues?.business_address || '',
      company_description: defaultValues?.company_description || '',
      website: defaultValues?.website || '',
      specialties: existingProfile?.specialties || defaultValues?.specialties || [],
      workload: existingProfile?.workload || defaultValues?.workload || 'Medium',
    },
    mode: 'onChange' // Enable validation on change
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField 
          control={form.control} 
          name="business_address" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Business Address
                <HelpTooltip content="Your business's physical location" />
              </FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Anytown, USA" {...field} />
              </FormControl>
              <FormDescription>
                Enter your company's address (optional). This helps with localized recommendations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="company_description" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Company Description
                <HelpTooltip content="A brief overview of your painting services and expertise" />
              </FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="We specialize in high-quality residential and commercial painting..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Briefly describe your business's services and unique qualities (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="website" 
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                Website
                <HelpTooltip content="Your company's website URL if you have one" />
              </FormLabel>
              <FormControl>
                <Input placeholder="https://yourcompany.com" {...field} />
              </FormControl>
              <FormDescription>
                Include the full URL with https:// for your business website (optional).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField 
          control={form.control} 
          name="specialties" 
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="flex items-center">
                  Specialties
                  <HelpTooltip content="Select all services your company offers" />
                </FormLabel>
                <FormDescription>
                  Select the types of painting services you offer. This helps us tailor your task priorities.
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {specialtiesOptions.map(specialty => (
                  <FormField
                    key={specialty.id}
                    control={form.control}
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
        
        <FormField
          control={form.control}
          name="workload"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center">
                Current Workload
                <HelpTooltip content="Your current business activity level" />
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Low" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Low - Looking for more projects
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Medium" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Medium - Steady workflow
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="High" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      High - At or near capacity
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                This helps us prioritize your tasks appropriately.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between items-center pt-2">
          {isAutosaving && (
            <span className="text-sm text-muted-foreground order-3 sm:order-2">
              Auto-saving your progress...
            </span>
          )}
          
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
            className="w-full sm:w-auto order-1 sm:order-3"
          >
            {buttonText}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DetailsForm;
