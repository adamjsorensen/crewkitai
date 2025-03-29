
import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAIContentSettings } from "@/hooks/useAIContentSettings";
import AIContentSettingsForm from "@/components/admin/content/AIContentSettingsForm";
import ContentGenerationSettingsPanel from "@/components/admin/content/ContentGenerationSettingsPanel";

const ContentSettingsPage = () => {
  const { 
    settings, 
    isLoading, 
    updateSettings, 
    initializeSettings 
  } = useAIContentSettings();
  
  // Initialize settings if needed
  React.useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  return (
    <AdminLayout activeTab="content-settings">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Content Generation Settings</h2>
          <p className="text-muted-foreground">
            Configure AI settings for content generation, prompt processing, and modification features
          </p>
        </div>
        
        <Separator className="my-6" />
        
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General AI Settings</TabsTrigger>
            <TabsTrigger value="generation">Content Generation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <AIContentSettingsForm 
              settings={settings}
              isLoading={isLoading}
              onUpdateSettings={updateSettings}
            />
          </TabsContent>
          
          <TabsContent value="generation">
            <ContentGenerationSettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ContentSettingsPage;
