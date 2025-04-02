
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ActivityLog } from "@/hooks/useActivityLogs";

interface ActivityLogDetailsProps {
  log: ActivityLog;
}

export const ActivityLogDetails: React.FC<ActivityLogDetailsProps> = ({ log }) => {
  // Format the action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case "chat_message":
        return "bg-blue-100 text-blue-800";
      case "chat_response":
        return "bg-green-100 text-green-800";
      case "compass_analyze":
        return "bg-purple-100 text-purple-800";
      case "content_generated":
        return "bg-amber-100 text-amber-800";
      case "content_generation_prompt":
        return "bg-indigo-100 text-indigo-800";
      case "login":
      case "logout":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">Timestamp</h3>
          <p>{format(new Date(log.created_at), "PPP p")}</p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">Action Type</h3>
          <Badge className={getActionBadgeColor(log.action_type)}>
            {formatActionType(log.action_type)}
          </Badge>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">User</h3>
          <p>{log.user ? log.user.full_name : "Unknown"}</p>
          <p className="text-sm text-muted-foreground">
            {log.user ? log.user.email : ""}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">Related Resource</h3>
          <p>
            {log.affected_resource_type ? (
              <>
                {log.affected_resource_type}
                {log.affected_resource_id && (
                  <span className="text-sm text-muted-foreground ml-1">
                    (ID: {log.affected_resource_id})
                  </span>
                )}
              </>
            ) : (
              "None"
            )}
          </p>
        </div>
      </div>

      <Separator />

      {log.action_type === "chat_message" && (
        <div>
          <h3 className="font-semibold mb-2">User Message</h3>
          <Card className="bg-muted/50">
            <CardContent className="p-4 whitespace-pre-wrap">
              {log.action_details?.user_message || "No message content"}
            </CardContent>
          </Card>
          {log.action_details?.conversation_id && (
            <p className="text-sm text-muted-foreground mt-2">
              Conversation ID: {log.action_details.conversation_id}
            </p>
          )}
        </div>
      )}

      {log.action_type === "chat_response" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">User Prompt</h3>
            <Card className="bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-4 whitespace-pre-wrap">
                {log.action_details?.prompt || "No prompt content"}
              </CardContent>
            </Card>
          </div>
          
          {log.action_details?.system_prompt && (
            <div>
              <h3 className="font-semibold mb-2">System Prompt</h3>
              <Card className="bg-purple-50 dark:bg-purple-950">
                <CardContent className="p-4 whitespace-pre-wrap font-mono text-sm">
                  {log.action_details.system_prompt}
                </CardContent>
              </Card>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">AI Response</h3>
            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="p-4 whitespace-pre-wrap">
                {log.action_details?.response || "No response content"}
              </CardContent>
            </Card>
          </div>
          {log.action_details?.conversation_id && (
            <p className="text-sm text-muted-foreground">
              Conversation ID: {log.action_details.conversation_id}
            </p>
          )}
        </div>
      )}

      {log.action_type === "content_generation_prompt" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Full Prompt</h3>
            <Card className="bg-indigo-50 dark:bg-indigo-950">
              <CardContent className="p-4 whitespace-pre-wrap">
                {log.action_details?.full_prompt || "No prompt content"}
              </CardContent>
            </Card>
          </div>
          
          {log.action_details?.system_prompt && (
            <div>
              <h3 className="font-semibold mb-2">System Prompt</h3>
              <Card className="bg-purple-50 dark:bg-purple-950">
                <CardContent className="p-4 whitespace-pre-wrap font-mono text-sm">
                  {log.action_details.system_prompt}
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Prompt Title</h3>
              <p>{log.action_details?.prompt_title || "Untitled Prompt"}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI Model</h3>
              <p>{log.action_details?.model || "Unknown model"}</p>
            </div>
          </div>
          
          {log.action_details?.generation_id && (
            <p className="text-sm text-muted-foreground">
              Generation ID: {log.action_details.generation_id}
            </p>
          )}
        </div>
      )}

      {log.action_type === "compass_analyze" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Input Text</h3>
            <Card className="bg-muted/50">
              <CardContent className="p-4 whitespace-pre-wrap">
                {log.action_details?.input_text || "No input text"}
              </CardContent>
            </Card>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Generated Tasks</h3>
            {log.action_details?.tasks && log.action_details.tasks.length > 0 ? (
              <div className="space-y-2">
                {log.action_details.tasks.map((task: any, index: number) => (
                  <Card key={index} className="bg-purple-50 dark:bg-purple-950">
                    <CardContent className="p-4">
                      <div className="font-medium">{task.title || task.text || `Task ${index + 1}`}</div>
                      {task.priority && (
                        <Badge className="mt-1">
                          {typeof task.priority === 'string' 
                            ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) 
                            : task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Due: {task.due_date}
                        </div>
                      )}
                      {task.reasoning && (
                        <div className="text-sm mt-2">
                          <span className="font-medium">Reasoning:</span> {task.reasoning}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No tasks generated</p>
            )}
          </div>
        </div>
      )}

      {log.action_type === "content_generated" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Content Type</h3>
            <p>{log.action_details?.content_type || "Unknown"}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Prompt</h3>
            <Card className="bg-muted/50">
              <CardContent className="p-4 whitespace-pre-wrap">
                {log.action_details?.prompt || "No prompt provided"}
              </CardContent>
            </Card>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Generated Content</h3>
            <Card className="bg-amber-50 dark:bg-amber-950">
              <CardContent className="p-4 whitespace-pre-wrap font-mono text-sm">
                {log.action_details?.generated_content || "No content generated"}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!["chat_message", "chat_response", "compass_analyze", "content_generated", "content_generation_prompt"].includes(log.action_type) && (
        <div>
          <h3 className="font-semibold mb-2">Details</h3>
          {Object.keys(log.action_details || {}).length > 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {JSON.stringify(log.action_details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground">No details available</p>
          )}
        </div>
      )}

      {log.ip_address && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">IP Address:</span> {log.ip_address}
        </div>
      )}

      {log.user_agent && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">User Agent:</span> {log.user_agent}
        </div>
      )}
    </div>
  );
};
