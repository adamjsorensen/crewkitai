
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
import { Settings, FileText } from "lucide-react";

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
      ai_coach_models: JSON.stringify({ default: "gpt-4o", think: "o3-mini-2025-01-31" }, null, 2),
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
            <TabsTrigger value="content-management" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>Content Management</span>
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
          
          <TabsContent value="content-management">
            <ContentManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AiSettingsForm;
