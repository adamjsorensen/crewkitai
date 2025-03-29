
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const ContentGenerationSettingsPanel = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Generation Configuration</CardTitle>
        <CardDescription>
          Additional settings for prompt customization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Additional content generation settings will be available in the next phase.
            This will include category management, default prompts, and more advanced customization options.
          </AlertDescription>
        </Alert>
        
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2">Current Features</h3>
          <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
            <li>Prompt library management</li>
            <li>Parameter and parameter tweak configuration</li>
            <li>Prompt customization wizard</li>
            <li>Content generation</li>
            <li>Content modification with AI</li>
            <li>Saving generated content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentGenerationSettingsPanel;
