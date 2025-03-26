
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
          Activity logging will be implemented in Phase 2 of the admin console development.
        </AlertDescription>
      </Alert>
      
      <p className="text-muted-foreground">
        This feature will track user interactions with the platform including:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
        <li>Chat conversations</li>
        <li>Compass plan creations</li>
        <li>Content generations</li>
        <li>Login/logout events</li>
        <li>Profile updates</li>
      </ul>

      <div className="mt-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard/user-management/activity-logs")}
        >
          View Activity Logs
        </Button>
      </div>
    </Card>
  );
};

export default ActivityLogsPage;
