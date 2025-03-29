
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AIContentSettings } from "@/hooks/useAIContentSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "lucide-react";

const formSchema = z.object({
  model: z.string(),
  temperature: z.coerce.number().min(0).max(1),
  max_tokens: z.coerce.number().min(1).max(8000),
  top_p: z.coerce.number().min(0).max(1),
  frequency_penalty: z.coerce.number().min(-2).max(2),
  presence_penalty: z.coerce.number().min(-2).max(2),
  api_key: z.string().optional(),
});

interface AIContentSettingsFormProps {
  settings: AIContentSettings | null;
  isLoading: boolean;
  onUpdateSettings: (settings: AIContentSettings) => void;
}

const AIContentSettingsForm = ({ settings, isLoading, onUpdateSettings }: AIContentSettingsFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: settings || {
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onUpdateSettings(values);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Settings</CardTitle>
        <CardDescription>
          Configure AI model and parameters for content generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The AI model to use for content generation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Controls randomness (0-1)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Tokens</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="8000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum length of generated content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="top_p"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top P</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="0" max="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Controls diversity via nucleus sampling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency_penalty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency Penalty</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="-2" max="2" {...field} />
                    </FormControl>
                    <FormDescription>
                      Reduces repetition of frequent tokens
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="presence_penalty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Presence Penalty</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" min="-2" max="2" {...field} />
                    </FormControl>
                    <FormDescription>
                      Encourages new topics
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Using default key" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Custom API key for this feature
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit">Save Settings</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AIContentSettingsForm;
