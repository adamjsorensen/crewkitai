
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
import { ScrollArea } from "@/components/ui/scroll-area";

const AiSettingsForm = () => {
  const [activeTab, setActiveTab] = React.useState("model-settings");
  const [activeSubtab, setActiveSubtab] = React.useState("system-prompt");
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

  const renderSubtabs = () => {
    const currentSubtabs = subtabs[activeTab as keyof typeof subtabs];
    if (!currentSubtabs || currentSubtabs.length === 0) return null;

    return (
      <ScrollArea className="mb-6 w-full">
        <div className="border-b flex no-wrap min-w-full overflow-x-auto hide-scrollbar pb-0.5">
          {currentSubtabs.map(subtab => (
            <button
              key={subtab.id}
              onClick={() => setActiveSubtab(subtab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap min-w-max tap-target ${
                activeSubtab === subtab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {subtab.label}
            </button>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderTabContent = () => {
    if (activeTab === "model-settings") {
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {activeSubtab === "system-prompt" && <SystemPromptField form={form} />}
            
            {activeSubtab === "temperature" && <TemperatureField form={form} />}
            
            {activeSubtab === "max-tokens" && <MaxTokensField form={form} />}
            
            {activeSubtab === "models" && <ModelsConfigField form={form} />}
            
            <div className="flex justify-end">
              <SaveButton isSaving={isSaving} />
            </div>
          </form>
        </Form>
      );
    }
    
    if (activeTab === "responses") {
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {activeSubtab === "follow-up" && <FollowUpQuestionsField form={form} />}
            
            {activeSubtab === "prompt" && <FollowUpPromptField form={form} />}
            
            <div className="flex justify-end">
              <SaveButton isSaving={isSaving} />
            </div>
          </form>
        </Form>
      );
    }
    
    if (activeTab === "welcome-content") {
      return <WelcomeContentManagement />;
    }
    
    if (activeTab === "content-filters") {
      return <ContentFilters />;
    }
    
    if (activeTab === "compass-settings") {
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {activeSubtab === "enabled" && <CompassAiEnabledField form={form} />}
            
            {activeSubtab === "system-prompt" && <CompassSystemPromptField form={form} />}
            
            <div className="flex justify-end">
              <SaveButton isSaving={isSaving} />
            </div>
          </form>
        </Form>
      );
    }
    
    return null;
  };
  
  return (
    <Card className="overflow-hidden w-full">
      <CardHeader className="pb-3">
        <h2 className="text-xl md:text-2xl font-semibold">AI Coach Settings</h2>
      </CardHeader>
      
      <CardContent className="w-full">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full mb-6" orientation="horizontal">
            <TabsList className="inline-flex w-auto min-w-max">
              <TabsTrigger value="model-settings" className="flex items-center gap-1.5 whitespace-nowrap touch-callout-none min-h-[2.75rem]">
                <Settings className="h-4 w-4" />
                <span className={isMobile ? "max-w-[80px] truncate" : ""}>Model Settings</span>
              </TabsTrigger>
              <TabsTrigger value="responses" className="flex items-center gap-1.5 whitespace-nowrap touch-callout-none min-h-[2.75rem]">
                <HelpCircle className="h-4 w-4" />
                <span className={isMobile ? "max-w-[80px] truncate" : ""}>Responses</span>
              </TabsTrigger>
              <TabsTrigger value="welcome-content" className="flex items-center gap-1.5 whitespace-nowrap touch-callout-none min-h-[2.75rem]">
                <MessageSquare className="h-4 w-4" />
                <span className={isMobile ? "max-w-[80px] truncate" : ""}>Welcome Content</span>
              </TabsTrigger>
              <TabsTrigger value="content-filters" className="flex items-center gap-1.5 whitespace-nowrap touch-callout-none min-h-[2.75rem]">
                <AlertTriangle className="h-4 w-4" />
                <span className={isMobile ? "max-w-[80px] truncate" : ""}>Content Filters</span>
              </TabsTrigger>
              <TabsTrigger value="compass-settings" className="flex items-center gap-1.5 whitespace-nowrap touch-callout-none min-h-[2.75rem]">
                <Compass className="h-4 w-4" />
                <span className={isMobile ? "max-w-[80px] truncate" : ""}>Compass</span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
          
          {renderSubtabs()}
          
          <div className="w-full max-w-full overflow-x-hidden overflow-y-visible">
            {renderTabContent()}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AiSettingsForm;
