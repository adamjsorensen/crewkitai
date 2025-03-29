
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Loader, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CustomPromptWizard from "@/components/content/CustomPromptWizard";
import { supabase } from "@/integrations/supabase/client";

const PromptPage = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  const { data: prompt, isLoading } = useQuery({
    queryKey: ['prompt', promptId],
    queryFn: async () => {
      if (!promptId) {
        throw new Error("Prompt ID is required");
      }
      
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data as Prompt;
    },
    enabled: !!promptId
  });
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!prompt) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-semibold">Prompt not found</h2>
          <p className="text-muted-foreground mb-4">This prompt may have been removed or does not exist</p>
          <Button onClick={() => navigate('/dashboard/prompt-library')}>
            View Prompt Library
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 mr-2" 
            onClick={() => navigate('/dashboard/prompt-library')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{prompt.title}</h1>
          {prompt.description && (
            <p className="text-muted-foreground mt-1">
              {prompt.description}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {prompt.hub_area && (
            <Badge variant="outline" className="text-xs capitalize">
              {prompt.hub_area}
            </Badge>
          )}
        </div>
        
        <Separator />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>Prompt Details</span>
            </CardTitle>
            <CardDescription>
              This prompt will help you generate content tailored for painting professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">What this prompt does:</h3>
                <p className="mt-1">
                  {prompt.description || "Generates professional content based on your customization choices."}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="gap-1.5"
                  onClick={() => setIsWizardOpen(true)}
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>Customize & Generate</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <CustomPromptWizard 
        promptId={prompt.id} 
        open={isWizardOpen} 
        onOpenChange={setIsWizardOpen} 
      />
    </DashboardLayout>
  );
};

export default PromptPage;
