
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
import { useIsMobile } from "@/hooks/use-mobile";

const AiSettingsForm = () => {
  const [activeTab, setActiveTab] = React.useState("model-settings");
  const { settings, isLoading, refetchSettings } = useAiSettings();
  const { saveSettings, isSaving } = useSaveAiSettings();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <h2 className="text-2xl font-semibold">AI Coach Settings</h2>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full overflow-x-auto flex flex-nowrap whitespace-nowrap">
            <TabsTrigger value="model-settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className={isMobile ? "hidden sm:inline" : ""}>Model Settings</span>
              <span className={isMobile ? "" : "hidden"}>Model</span>
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Responses</span>
            </TabsTrigger>
            <TabsTrigger value="welcome-content" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className={isMobile ? "hidden sm:inline" : ""}>Welcome Content</span>
              <span className={isMobile ? "" : "hidden"}>Welcome</span>
            </TabsTrigger>
            <TabsTrigger value="content-filters" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className={isMobile ? "hidden sm:inline" : ""}>Content Filters</span>
              <span className={isMobile ? "" : "hidden"}>Filters</span>
            </TabsTrigger>
            <TabsTrigger value="compass-settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Compass</span>
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
          
          <TabsContent value="compass-settings">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <CompassAiEnabledField form={form} />
                
                <CompassSystemPromptField form={form} />
                
                <SaveButton isSaving={isSaving} />
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AiSettingsForm;
