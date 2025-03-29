
import React, { useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAIContentSettings } from "@/hooks/useAIContentSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ContentSettingsPage = () => {
  const { toast } = useToast();
  const { settings, isLoading, initializeSettings, updateSettings } = useAIContentSettings();
  
  // Local state for form values
  const [systemPrompt, setSystemPrompt] = React.useState(settings.systemPrompt);
  const [temperature, setTemperature] = React.useState(settings.temperature);
  const [maxTokens, setMaxTokens] = React.useState(settings.maxTokens);
  const [model, setModel] = React.useState(settings.model);
  const [modifierTemperature, setModifierTemperature] = React.useState(settings.contentModifierTemperature);
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Initialize settings if needed
  useEffect(() => {
    const init = async () => {
      await initializeSettings();
    };
    
    init();
  }, [initializeSettings]);
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (!isLoading && settings) {
      setSystemPrompt(settings.systemPrompt);
      setTemperature(settings.temperature);
      setMaxTokens(settings.maxTokens);
      setModel(settings.model);
      setModifierTemperature(settings.contentModifierTemperature);
    }
  }, [settings, isLoading]);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await updateSettings({
        systemPrompt,
        temperature,
        maxTokens,
        model,
        contentModifierTemperature: modifierTemperature
      });
      
      toast({
        title: "Settings saved",
        description: "Content generation settings have been updated successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <AdminLayout activeTab="content-settings">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout activeTab="content-settings">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Content Generation Settings</h2>
        <p className="text-muted-foreground">
          Configure AI settings for the content generation system
        </p>
      </div>
      
      <Separator className="my-6" />
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Generator Settings</CardTitle>
            <CardDescription>
              Configure how the AI generates content for users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                This is the core instruction given to the AI model for content generation.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Powerful, supports vision)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster, lower cost)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select which AI model to use for generating content.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={(values) => setTemperature(values[0])}
              />
              <p className="text-sm text-muted-foreground">
                Lower values (0.0-0.3) produce more focused, deterministic outputs. Higher values (0.7-1.0) produce more creative, varied outputs.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min={100}
                max={4000}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of tokens (roughly words) the AI can generate in a response.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Content Modifier Settings</CardTitle>
            <CardDescription>
              Configure how the AI modifies existing content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="modifierTemperature">Temperature: {modifierTemperature.toFixed(1)}</Label>
              </div>
              <Slider
                id="modifierTemperature"
                min={0}
                max={1}
                step={0.1}
                value={[modifierTemperature]}
                onValueChange={(values) => setModifierTemperature(values[0])}
              />
              <p className="text-sm text-muted-foreground">
                Controls how creative the AI is when modifying content. Lower values stick closer to the original.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="min-w-[120px]"
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default ContentSettingsPage;
