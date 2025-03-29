
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CustomPromptWizard from "@/components/content/CustomPromptWizard";

const PromptDetailPage = () => {
  const { promptId } = useParams<{ promptId: string }>();
  const navigate = useNavigate();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  
  const { getPromptById, isLoading } = useCrewkitPrompts();
  
  const { data: prompt, isLoading: isLoadingPrompt } = useQuery({
    queryKey: ['prompt', promptId],
    queryFn: async () => {
      if (!promptId) {
        throw new Error("Prompt ID is required");
      }
      return getPromptById(promptId);
    },
    enabled: !!promptId
  });
  
  const handleBackClick = () => {
    navigate('/dashboard/prompt-library');
  };
  
  const handleCustomize = () => {
    setIsWizardOpen(true);
  };
  
  const loading = isLoading || isLoadingPrompt;
  
  if (loading) {
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
          <Button onClick={handleBackClick}>
            Return to Prompt Library
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
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-muted-foreground">{prompt.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">
            {prompt.hub_area || 'General'}
          </Badge>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Template</CardTitle>
                <CardDescription>
                  This is the base prompt that will be customized based on your selections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {prompt.prompt || 'No prompt template available'}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Generate Content</CardTitle>
                <CardDescription>
                  Customize this prompt and generate content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Use our wizard to customize this prompt template and generate unique content
                  tailored to your specific needs.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full gap-1.5" onClick={handleCustomize}>
                  <Sparkles className="h-4 w-4" />
                  <span>Customize & Generate</span>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {promptId && (
        <CustomPromptWizard
          promptId={promptId}
          open={isWizardOpen}
          onOpenChange={setIsWizardOpen}
        />
      )}
    </DashboardLayout>
  );
};

export default PromptDetailPage;
