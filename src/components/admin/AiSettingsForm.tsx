
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAiSettings, useSaveAiSettings } from "@/hooks/useAiSettings";
import { aiSettingsFormSchema, AiSettingsFormValues } from "./settings/types";
import SystemPromptField from "./settings/SystemPromptField";
import TemperatureField from "./settings/TemperatureField";
import MaxTokensField from "./settings/MaxTokensField";
import ModelsConfigField from "./settings/ModelsConfigField";
import ContentManagement from "./settings/ContentManagement";
import SaveButton from "./settings/SaveButton";
import LoadingSpinner from "./settings/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageSquare, AlertTriangle, HelpCircle, Compass } from "lucide-react";
import WelcomeContentManagement from "./settings/WelcomeContentManagement";
import ContentFilters from "./settings/ContentFilters";
import FollowUpQuestionsField from "./settings/FollowUpQuestionsField";
import FollowUpPromptField from "./settings/FollowUpPromptField";
import { useToast } from "@/hooks/use-toast";
import CompassAiEnabledField from "./settings/CompassAiEnabledField";
import CompassSystemPromptField from "./settings/CompassSystemPromptField";

const AiSettingsForm = () => {
  const [activeTab, setActiveTab] = React.useState("model-settings");
  const { settings, isLoading, refetchSettings } = useAiSettings();
  const { saveSettings, isSaving } = useSaveAiSettings();
  const { toast } = useToast();
  
  // Initialize form with default values
  const form = useForm<AiSettingsFormValues>({
    resolver: zodResolver(aiSettingsFormSchema),
    defaultValues: {
      ai_coach_system_prompt: "",
      ai_coach_temperature: "0.7",
      ai_coach_max_tokens: "1000",
      ai_coach_models: JSON.stringify({ default: "gpt-4o-mini", think: "gpt-4o" }, null, 2),
      ai_coach_follow_up_enabled: "true",
      ai_coach_follow_up_defaults: JSON.stringify([
        "How do I price a job properly?",
        "What marketing strategies work best for painters?",
        "How can I improve my crew's efficiency?",
        "What should I include in my contracts?"
      ], null, 2),
      ai_coach_follow_up_prompt: "After your response, suggest 2-3 follow-up questions that would be helpful for the user to continue the conversation.",
      compass_ai_enabled: "true",
      compass_ai_system_prompt: `You are a strategic planning assistant for a painting business. Your job is to extract tasks from the user's input, prioritize them, and suggest due dates.`,
    },
  });
  
  // Update form values when settings are loaded
  React.useEffect(() => {
    if (!isLoading && Object.keys(settings).length > 0) {
      console.log("Settings loaded, updating form:", settings);
      form.reset(settings);
    }
  }, [settings, isLoading, form]);
  
  // Submit form handler
  const onSubmit = async (values: AiSettingsFormValues) => {
    console.log("Form submitted with values:", values);
    const success = await saveSettings(values);
    if (success) {
      // Refetch settings to update the form with saved values
      refetchSettings();
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  const subtabs = {
    "model-settings": [
      { id: "system-prompt", label: "System Prompt" },
      { id: "temperature", label: "Temperature" },
      { id: "max-tokens", label: "Max Tokens" },
      { id: "models", label: "Models Config" }
    ],
    "responses": [
      { id: "follow-up", label: "Follow-up Questions" },
      { id: "prompt", label: "Question Prompt" }
    ],
    "welcome-content": [],
    "content-filters": [],
    "compass-settings": [
      { id: "enabled", label: "AI Enabled" },
      { id: "system-prompt", label: "System Prompt" }
    ]
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-xl md:text-2xl font-semibold">AI Coach Settings</h2>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto hide-scrollbar">
            <TabsList className="mb-6 inline-flex w-auto min-w-max">
              <TabsTrigger value="model-settings" className="flex items-center gap-1.5 whitespace-nowrap">
                <Settings className="h-4 w-4" />
                <span>Model Settings</span>
              </TabsTrigger>
              <TabsTrigger value="responses" className="flex items-center gap-1.5 whitespace-nowrap">
                <HelpCircle className="h-4 w-4" />
                <span>Responses</span>
              </TabsTrigger>
              <TabsTrigger value="welcome-content" className="flex items-center gap-1.5 whitespace-nowrap">
                <MessageSquare className="h-4 w-4" />
                <span>Welcome Content</span>
              </TabsTrigger>
              <TabsTrigger value="content-filters" className="flex items-center gap-1.5 whitespace-nowrap">
                <AlertTriangle className="h-4 w-4" />
                <span>Content Filters</span>
              </TabsTrigger>
              <TabsTrigger value="compass-settings" className="flex items-center gap-1.5 whitespace-nowrap">
                <Compass className="h-4 w-4" />
                <span>Compass</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Model Settings Tab */}
          <TabsContent value="model-settings">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <SystemPromptField form={form} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TemperatureField form={form} />
                  <MaxTokensField form={form} />
                </div>
                
                <ModelsConfigField form={form} />
                
                <div className="flex justify-end">
                  <SaveButton isSaving={isSaving} />
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Responses Tab */}
          <TabsContent value="responses">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FollowUpQuestionsField form={form} />
                
                <FollowUpPromptField form={form} />
                
                <div className="flex justify-end">
                  <SaveButton isSaving={isSaving} />
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Welcome Content Tab */}
          <TabsContent value="welcome-content">
            <WelcomeContentManagement />
          </TabsContent>
          
          {/* Content Filters Tab */}
          <TabsContent value="content-filters">
            <ContentFilters />
          </TabsContent>
          
          {/* Compass Settings Tab */}
          <TabsContent value="compass-settings">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CompassAiEnabledField form={form} />
                
                <CompassSystemPromptField form={form} />
                
                <div className="flex justify-end">
                  <SaveButton isSaving={isSaving} />
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AiSettingsForm;
