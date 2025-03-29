
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, ListFilter, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const ContentGenerationSettingsPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Content Generation Settings</AlertTitle>
        <AlertDescription>
          Configure parameters, prompts, and categories for the content generation feature.
          Use these pages to manage the system's prompt library and customization options.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/admin/prompts')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <FileText className="h-4 w-4 mr-2" />
              Prompts Management
            </CardTitle>
            <CardDescription>
              Manage the prompt library and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Configure base prompts
              </span>
              <Badge variant="outline">Configure</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/admin/parameters')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <ListFilter className="h-4 w-4 mr-2" />
              Parameters Management
            </CardTitle>
            <CardDescription>
              Configure parameters and tweaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Customize prompt options
              </span>
              <Badge variant="outline">Configure</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/admin/generations')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <Settings className="h-4 w-4 mr-2" />
              Generations View
            </CardTitle>
            <CardDescription>
              View and manage generated content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Coming soon
              </span>
              <Badge variant="secondary">Planned</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/prompt-library')}>
          View Prompt Library
        </Button>
      </div>
    </div>
  );
};

export default ContentGenerationSettingsPanel;
