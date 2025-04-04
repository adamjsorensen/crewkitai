
import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { ActivityLog } from "@/hooks/useActivityLogs";

interface ActivityLogRowProps {
  log: ActivityLog;
  onClick: () => void;
}

export const ActivityLogRow: React.FC<ActivityLogRowProps> = ({ log, onClick }) => {
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
      case "delete_user":
      case "bulk_delete_users":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Truncate long content with ellipsis
  const truncateContent = (content: string, maxLength = 100) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Format date and time safely
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "hh:mm a");
    } catch (error) {
      console.error("Invalid time format:", dateString);
      return "Invalid time";
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/60" 
      onClick={onClick}
    >
      <TableCell className="whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-medium">
            {formatDate(log.created_at)}
          </span>
          <span className="text-xs text-muted-foreground flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {formatTime(log.created_at)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {log.user ? (
          <div className="flex flex-col">
            <span className="font-medium">{log.user.full_name || "Unnamed User"}</span>
            <span className="text-xs text-muted-foreground">{log.user.email || "No email"}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Unknown user</span>
        )}
      </TableCell>
      <TableCell>
        <Badge 
          className={getActionBadgeColor(log.action_type)}
          variant="outline"
        >
          {formatActionType(log.action_type)}
        </Badge>
      </TableCell>
      <TableCell className="max-w-sm">
        {log.action_type === "chat_message" ? (
          <div className="text-sm">
            <span className="font-medium">Prompt:</span>{" "}
            {truncateContent(log.action_details?.user_message || "No prompt found")}
          </div>
        ) : log.action_type === "chat_response" ? (
          <div className="text-sm">
            <span className="font-medium">Prompt:</span>{" "}
            {truncateContent(log.action_details?.prompt || "No prompt found")}
            <br />
            <span className="font-medium">Response:</span>{" "}
            {truncateContent(log.action_details?.response || "No response found")}
          </div>
        ) : log.action_type === "compass_analyze" ? (
          <div className="text-sm">
            <span className="font-medium">Input:</span>{" "}
            {truncateContent(log.action_details?.input_text || "No input found")}
            <br />
            <span className="font-medium">Tasks:</span>{" "}
            {log.action_details?.tasks ? `${log.action_details.tasks.length} tasks generated` : "No tasks found"}
          </div>
        ) : log.action_type === "content_generation_prompt" ? (
          <div className="text-sm">
            <span className="font-medium">Prompt:</span>{" "}
            {truncateContent(log.action_details?.full_prompt || "No prompt found")}
            <br />
            <span className="font-medium">Title:</span>{" "}
            {log.action_details?.prompt_title || "Untitled Prompt"}
          </div>
        ) : log.action_type === "content_generated" ? (
          <div className="text-sm">
            <span className="font-medium">Type:</span>{" "}
            {log.action_details?.content_type || "Unknown"}
            <br />
            <span className="font-medium">Content:</span>{" "}
            {truncateContent(log.action_details?.generated_content || "No content found")}
          </div>
        ) : log.action_type === "delete_user" ? (
          <div className="text-sm">
            <span className="font-medium">User:</span>{" "}
            {log.action_details?.user_name || log.action_details?.user_email || "Unknown user"}
          </div>
        ) : log.action_type === "bulk_delete_users" ? (
          <div className="text-sm">
            <span className="font-medium">Count:</span>{" "}
            {log.action_details?.count || 0} users deleted
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {Object.keys(log.action_details || {}).length > 0
              ? truncateContent(JSON.stringify(log.action_details))
              : "No details available"}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};
