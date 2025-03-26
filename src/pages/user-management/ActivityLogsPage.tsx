
import React, { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Clock, Download, Filter, Search, X } from "lucide-react";
import { format } from "date-fns";
import UserManagementLayout from "@/components/user-management/UserManagementLayout";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLogs";
import { ActivityLogListSkeleton } from "@/components/user-management/ActivityLogsSkeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const ACTION_TYPES = [
  { value: "all", label: "All Activities" },
  { value: "chat_message", label: "Chat Messages" },
  { value: "chat_response", label: "AI Responses" },
  { value: "compass_analyze", label: "Compass Analysis" },
  { value: "content_generated", label: "Generated Content" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "profile_update", label: "Profile Update" },
];

const ActivityLogsPage: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [showExportOptions, setShowExportOptions] = useState(false);

  const { 
    logs, 
    isLoading, 
    filters, 
    updateFilters, 
    pagination,
    refetch 
  } = useActivityLogs({
    limit: 10,
    dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
    dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
  });

  const handleSearch = () => {
    // Use search term to filter logs
    // This would typically be implemented in the backend
    console.log("Searching for:", searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom(undefined);
    setDateTo(undefined);
    updateFilters({
      actionType: "all",
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handleExport = () => {
    // Export would be implemented here
    console.log(`Exporting as ${exportFormat}`);
    setShowExportOptions(false);
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
      case "login":
      case "logout":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format the action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Check if string is JSON
  const isJsonString = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Format content for display
  const formatContent = (content: string) => {
    if (isJsonString(content)) {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return content;
      }
    }
    return content;
  };

  // Truncate long content with ellipsis
  const truncateContent = (content: string, maxLength = 100) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <UserManagementLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Activity Logs</h2>
            <Badge variant="outline" className="ml-2">
              {pagination.pageCount > 0 ? pagination.count : 0} Records
            </Badge>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8 w-full sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            
            <Select
              value={filters.actionType || "all"}
              onValueChange={(value) => updateFilters({ actionType: value })}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowExportOptions(!showExportOptions)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export logs</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {filters.actionType !== "all" || dateFrom || dateTo || searchTerm ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear filters</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
                size="sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  setDateFrom(date);
                  setIsFromOpen(false);
                  if (date) {
                    updateFilters({ dateFrom: format(date, "yyyy-MM-dd") });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={isToOpen} onOpenChange={setIsToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
                size="sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  setDateTo(date);
                  setIsToOpen(false);
                  if (date) {
                    updateFilters({ dateTo: format(date, "yyyy-MM-dd") });
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {showExportOptions && (
            <div className="flex gap-2 items-center ml-auto">
              <Select
                value={exportFormat}
                onValueChange={(value: "csv" | "json") => setExportFormat(value)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleExport}>
                Export
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <ActivityLogListSkeleton />
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/60" 
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(log.created_at), "dd MMM yyyy")}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(new Date(log.created_at), "hh:mm a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user.full_name}</span>
                            <span className="text-xs text-muted-foreground">{log.user.email}</span>
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
                        ) : log.action_type === "content_generated" ? (
                          <div className="text-sm">
                            <span className="font-medium">Type:</span>{" "}
                            {log.action_details?.content_type || "Unknown"}
                            <br />
                            <span className="font-medium">Content:</span>{" "}
                            {truncateContent(log.action_details?.generated_content || "No content found")}
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {pagination.pageCount > 1 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing page {pagination.currentPage} of {pagination.pageCount}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                    disabled={pagination.currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => pagination.onPageChange(Math.min(pagination.pageCount, pagination.currentPage + 1))}
                    disabled={pagination.currentPage === pagination.pageCount}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => pagination.onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Timestamp</h3>
                    <p>{format(new Date(selectedLog.created_at), "PPP p")}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Action Type</h3>
                    <Badge className={getActionBadgeColor(selectedLog.action_type)}>
                      {formatActionType(selectedLog.action_type)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">User</h3>
                    <p>{selectedLog.user ? selectedLog.user.full_name : "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.user ? selectedLog.user.email : ""}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-1">Related Resource</h3>
                    <p>
                      {selectedLog.affected_resource_type ? (
                        <>
                          {selectedLog.affected_resource_type}
                          {selectedLog.affected_resource_id && (
                            <span className="text-sm text-muted-foreground ml-1">
                              (ID: {selectedLog.affected_resource_id})
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

                {selectedLog.action_type === "chat_message" && (
                  <div>
                    <h3 className="font-semibold mb-2">User Message</h3>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4 whitespace-pre-wrap">
                        {selectedLog.action_details?.user_message || "No message content"}
                      </CardContent>
                    </Card>
                    {selectedLog.action_details?.conversation_id && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Conversation ID: {selectedLog.action_details.conversation_id}
                      </p>
                    )}
                  </div>
                )}

                {selectedLog.action_type === "chat_response" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">User Prompt</h3>
                      <Card className="bg-blue-50 dark:bg-blue-950">
                        <CardContent className="p-4 whitespace-pre-wrap">
                          {selectedLog.action_details?.prompt || "No prompt content"}
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">AI Response</h3>
                      <Card className="bg-green-50 dark:bg-green-950">
                        <CardContent className="p-4 whitespace-pre-wrap">
                          {selectedLog.action_details?.response || "No response content"}
                        </CardContent>
                      </Card>
                    </div>
                    {selectedLog.action_details?.conversation_id && (
                      <p className="text-sm text-muted-foreground">
                        Conversation ID: {selectedLog.action_details.conversation_id}
                      </p>
                    )}
                  </div>
                )}

                {selectedLog.action_type === "compass_analyze" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Input Text</h3>
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 whitespace-pre-wrap">
                          {selectedLog.action_details?.input_text || "No input text"}
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Generated Tasks</h3>
                      {selectedLog.action_details?.tasks && selectedLog.action_details.tasks.length > 0 ? (
                        <div className="space-y-2">
                          {selectedLog.action_details.tasks.map((task: any, index: number) => (
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

                {selectedLog.action_type === "content_generated" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Content Type</h3>
                      <p>{selectedLog.action_details?.content_type || "Unknown"}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Prompt</h3>
                      <Card className="bg-muted/50">
                        <CardContent className="p-4 whitespace-pre-wrap">
                          {selectedLog.action_details?.prompt || "No prompt provided"}
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Generated Content</h3>
                      <Card className="bg-amber-50 dark:bg-amber-950">
                        <CardContent className="p-4 whitespace-pre-wrap font-mono text-sm">
                          {selectedLog.action_details?.generated_content || "No content generated"}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {!["chat_message", "chat_response", "compass_analyze", "content_generated"].includes(selectedLog.action_type) && (
                  <div>
                    <h3 className="font-semibold mb-2">Details</h3>
                    {Object.keys(selectedLog.action_details || {}).length > 0 ? (
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {JSON.stringify(selectedLog.action_details, null, 2)}
                          </pre>
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-muted-foreground">No details available</p>
                    )}
                  </div>
                )}

                {selectedLog.ip_address && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">IP Address:</span> {selectedLog.ip_address}
                  </div>
                )}

                {selectedLog.user_agent && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">User Agent:</span> {selectedLog.user_agent}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UserManagementLayout>
  );
};

export default ActivityLogsPage;
