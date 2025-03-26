
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ActivityLogsPage = () => {
  const navigate = useNavigate();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">User Activity Logs</h3>
      
      <Alert variant="default" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Activity logs are now being tracked! You can view detailed logs in the User Management section.
        </AlertDescription>
      </Alert>
      
      <p className="text-muted-foreground mb-4">
        The activity logs track detailed user interactions including:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground mb-6">
        <li>AI chat conversations and prompts</li>
        <li>Generated responses and content</li>
        <li>Strategic Compass plan creations and task completions</li>
        <li>Content generation requests</li>
        <li>Login/logout events and user profile updates</li>
      </ul>

      <div className="mt-6">
        <Button 
          onClick={() => navigate("/dashboard/user-management/activity-logs")}
        >
          View Detailed Activity Logs
        </Button>
      </div>
    </Card>
  );
};

export default ActivityLogsPage;
