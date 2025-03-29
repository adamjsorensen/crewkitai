
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AIContentSettings } from "@/hooks/useAIContentSettings";
import { Loader } from "lucide-react";

interface AIContentSettingsFormProps {
  settings: AIContentSettings;
  isLoading: boolean;
  onUpdateSettings: (settings: AIContentSettings) => Promise<void>;
}

const formSchema = z.object({
  model: z.string().min(1, "Model is required"),
  temperature: z.coerce.number().min(0).max(1),
  max_tokens: z.coerce.number().int().min(1).max(8192),
  top_p: z.coerce.number().min(0).max(1),
  frequency_penalty: z.coerce.number().min(0).max(2),
  presence_penalty: z.coerce.number().min(0).max(2),
  api_key: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const modelOptions = [
  { label: "GPT-4o (powerful, balanced)", value: "gpt-4o" },
  { label: "GPT-4o-mini (faster, economical)", value: "gpt-4o-mini" },
];

const AIContentSettingsForm = ({ settings, isLoading, onUpdateSettings }: AIContentSettingsFormProps) => {
  const [isSaving, setIsSaving] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      top_p: settings.top_p,
      frequency_penalty: settings.frequency_penalty,
      presence_penalty: settings.presence_penalty,
      api_key: settings.api_key || "",
    },
  });

  React.useEffect(() => {
    if (settings && !isLoading) {
      form.reset({
        model: settings.model,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        top_p: settings.top_p,
        frequency_penalty: settings.frequency_penalty,
        presence_penalty: settings.presence_penalty,
        api_key: settings.api_key || "",
      });
    }
  }, [settings, isLoading, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      await onUpdateSettings({
        ...values,
        temperature: Number(values.temperature),
        max_tokens: Number(values.max_tokens),
        top_p: Number(values.top_p),
        frequency_penalty: Number(values.frequency_penalty),
        presence_penalty: Number(values.presence_penalty),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Content Generation Settings</CardTitle>
        <CardDescription>
          Configure the AI model settings for content generation
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The OpenAI model to use for content generation
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
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                      />
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
                      <Input
                        type="number"
                        min="100"
                        max="8192"
                        step="1"
                        {...field}
                      />
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
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        {...field}
                      />
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
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        {...field}
                      />
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
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Increases likelihood of new topics
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI API Key (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom API key for content generation (leave empty to use system default)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default AIContentSettingsForm;
