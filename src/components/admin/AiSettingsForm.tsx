
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card,
  CardHeader,
  CardContent,
  CardFooter
} from "@/components/ui/card";

// Define the form schema
const formSchema = z.object({
  ai_coach_system_prompt: z.string().min(10, {
    message: "System prompt must be at least 10 characters",
  }),
  ai_coach_temperature: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 1;
    },
    {
      message: "Temperature must be a number between 0 and 1",
    }
  ),
  ai_coach_max_tokens: z.string().refine(
    (val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 4000;
    },
    {
      message: "Max tokens must be a number between 1 and 4000",
    }
  ),
  ai_coach_models: z.string().min(5, {
    message: "Model configuration is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const AiSettingsForm = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ai_coach_system_prompt: "",
      ai_coach_temperature: "0.7",
      ai_coach_max_tokens: "1000",
      ai_coach_models: JSON.stringify({ default: "gpt-4o", think: "o3-mini-2025-01-31" }, null, 2),
    },
  });
  
  // Load settings from database
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_settings")
          .select("name, value")
          .in("name", [
            "ai_coach_system_prompt",
            "ai_coach_temperature",
            "ai_coach_max_tokens",
            "ai_coach_models"
          ]);
        
        if (error) throw error;
        
        if (data) {
          const formValues: any = {};
          
          data.forEach(setting => {
            let value = setting.value;
            // If the value appears to be a JSON string, parse it
            if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{'))) {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // Keep as is if parsing fails
              }
            }
            
            // If it's an object, stringify it for display
            if (typeof value === 'object') {
              formValues[setting.name] = JSON.stringify(value, null, 2);
            } else {
              formValues[setting.name] = String(value);
            }
          });
          
          form.reset(formValues);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load AI settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [form, toast]);
  
  // Submit form handler
  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    
    try {
      // Process each setting
      for (const [key, value] of Object.entries(values)) {
        let processedValue = value;
        
        // Try to parse JSON fields
        if (key === 'ai_coach_models') {
          try {
            processedValue = JSON.parse(value);
          } catch (e) {
            toast({
              title: "Invalid JSON",
              description: `${key} must be valid JSON`,
              variant: "destructive",
            });
            setIsSaving(false);
            return;
          }
        }
        
        // Update the setting
        const { error } = await supabase
          .from("ai_settings")
          .update({ value: processedValue })
          .eq("name", key);
        
        if (error) throw error;
      }
      
      toast({
        title: "Settings Updated",
        description: "AI settings have been successfully updated",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update AI settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card className="p-6">
      <CardHeader className="pb-3">
        <h2 className="text-2xl font-semibold">AI Coach Settings</h2>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ai_coach_system_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormDescription>
                    The system prompt defines how the AI coach behaves and responds
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={8}
                      placeholder="Enter system prompt" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ai_coach_temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormDescription>
                      Controls randomness (0.0 to 1.0). Lower values make responses more deterministic.
                    </FormDescription>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0" 
                        max="1" 
                        step="0.1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ai_coach_max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormDescription>
                      Maximum tokens in the AI response (1 to 4000)
                    </FormDescription>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        max="4000"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="ai_coach_models"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Models Configuration (JSON)</FormLabel>
                  <FormDescription>
                    Configure the AI models as a JSON object
                  </FormDescription>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={5}
                      placeholder='{"default": "gpt-4o", "think": "o3-mini-2025-01-31"}'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AiSettingsForm;
