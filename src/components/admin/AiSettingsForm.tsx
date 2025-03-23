
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
import { Settings, MessageSquare, AlertTriangle, HelpCircle } from "lucide-react";
import WelcomeContentManagement from "./settings/WelcomeContentManagement";
import ContentFilters from "./settings/ContentFilters";
import FollowUpQuestionsField from "./settings/FollowUpQuestionsField";
import FollowUpPromptField from "./settings/FollowUpPromptField";

const AiSettingsForm = () => {
  const [activeTab, setActiveTab] = React.useState("model-settings");
  const { settings, isLoading } = useAiSettings();
  const { saveSettings, isSaving } = useSaveAiSettings();
  
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
    },
  });
  
  // Update form values when settings are loaded
  React.useEffect(() => {
    if (!isLoading && Object.keys(settings).length > 0) {
      form.reset(settings);
    }
  }, [settings, isLoading, form]);
  
  // Submit form handler
  const onSubmit = async (values: AiSettingsFormValues) => {
    await saveSettings(values);
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-2xl font-semibold">AI Coach Settings</h2>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="model-settings" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" />
              <span>Model Settings</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              <span>Responses</span>
            </TabsTrigger>
            <TabsTrigger value="welcome-content" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>Welcome Content</span>
            </TabsTrigger>
            <TabsTrigger value="content-filters" className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Content Filters</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="model-settings">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <SystemPromptField form={form} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TemperatureField form={form} />
                  <MaxTokensField form={form} />
                </div>
                
                <ModelsConfigField form={form} />
                
                <SaveButton isSaving={isSaving} />
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="responses">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FollowUpQuestionsField form={form} />
                
                <FollowUpPromptField form={form} />
                
                <SaveButton isSaving={isSaving} />
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="welcome-content">
            <WelcomeContentManagement />
          </TabsContent>
          
          <TabsContent value="content-filters">
            <ContentFilters />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AiSettingsForm;
