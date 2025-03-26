
import React, { useState } from "react";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { AlertCircle, Calendar, Download, FilterX, Search, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Common action types we might want to filter by
const ACTION_TYPES = [
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "create_user", label: "Create User" },
  { value: "update_user", label: "Update User" },
  { value: "delete_user", label: "Delete User" },
  { value: "reset_password", label: "Reset Password" },
  { value: "bulk_delete_users", label: "Bulk Delete Users" },
];

// Get a readable description of the activity
const getActivityDescription = (log: ActivityLog): string => {
  const actionTypeMap: Record<string, string> = {
    login: "logged in",
    logout: "logged out",
    create_user: "created a user",
    update_user: "updated a user",
    delete_user: "deleted a user",
    bulk_delete_users: "deleted multiple users",
    reset_password: "reset password",
    export_users: "exported users data",
  };

  const action = actionTypeMap[log.action_type] || log.action_type.replace(/_/g, ' ');
  
  // Basic description
  let description = `${log.user?.full_name || 'A user'} ${action}`;
  
  // Add affected user if applicable
  if (log.affected_user_id && log.affected_user) {
    description += ` for ${log.affected_user.full_name}`;
  }
  
  return description;
};

// Get badge for action type
const getActionBadge = (actionType: string) => {
  const badgeStyles: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    login: { 
      variant: "outline", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
    logout: { 
      variant: "outline", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
    create_user: { 
      variant: "default", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
    update_user: { 
      variant: "secondary", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
    delete_user: { 
      variant: "destructive", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
    bulk_delete_users: { 
      variant: "destructive", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
    reset_password: { 
      variant: "secondary", 
      icon: <User className="h-3 w-3 mr-1" /> 
    },
  };

  const style = badgeStyles[actionType] || { variant: "outline", icon: null };
  
  return (
    <Badge variant={style.variant} className="flex items-center gap-1">
      {style.icon}
      {actionType.replace(/_/g, ' ')}
    </Badge>
  );
};

const ActivityLogDetails = ({ log }: { log: ActivityLog }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">User</h4>
          <p>{log.user?.full_name || 'Unknown'} ({log.user?.email || 'No email'})</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Date & Time</h4>
          <p>{format(new Date(log.created_at), 'PPpp')}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Action</h4>
          <div className="flex items-center gap-2">
            {getActionBadge(log.action_type)}
          </div>
        </div>
        
        {log.affected_user_id && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Affected User</h4>
            <p>{log.affected_user?.full_name || 'Unknown'} ({log.affected_user?.email || 'No email'})</p>
          </div>
        )}
        
        {log.ip_address && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">IP Address</h4>
            <p>{log.ip_address}</p>
          </div>
        )}
        
        {log.user_agent && (
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">User Agent</h4>
            <p className="text-sm break-words">{log.user_agent}</p>
          </div>
        )}
      </div>
      
      {Object.keys(log.action_details || {}).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Action Details</h4>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
            {JSON.stringify(log.action_details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const ActivityLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const { toast } = useToast();

  // Get logs with pagination
  const { 
    logs, 
    isLoading, 
    pagination, 
    filters, 
    updateFilters 
  } = useActivityLogs({
    limit: 10,
    actionType: actionTypeFilter || undefined,
    dateFrom: startDate ? startDate.toISOString() : undefined,
    dateTo: endDate ? endDate.toISOString() : undefined
  });

  // Filter logs based on search term (client-side filtering)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      (log.user?.full_name?.toLowerCase() || '').includes(searchLower) ||
      (log.user?.email?.toLowerCase() || '').includes(searchLower) ||
      (log.affected_user?.full_name?.toLowerCase() || '').includes(searchLower) ||
      log.action_type.toLowerCase().includes(searchLower)
    );
  });

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setActionTypeFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    updateFilters({
      actionType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      offset: 0
    });
  };

  // Export logs as CSV
  const handleExportLogs = () => {
    try {
      // Create CSV content
      const headers = ["Date", "User", "Email", "Action", "IP Address", "Details"];
      const csvRows = [
        headers.join(","),
        ...logs.map(log => [
          `"${format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
          `"${log.user?.full_name || ''}"`,
          `"${log.user?.email || ''}"`,
          `"${log.action_type}"`,
          `"${log.ip_address || ''}"`,
          `"${JSON.stringify(log.action_details).replace(/"/g, '""')}"`
        ].join(","))
      ];
      const csvContent = csvRows.join("\n");

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "activity_logs.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Logs exported",
        description: `${logs.length} logs exported to CSV successfully.`
      });
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the logs.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold mb-4">User Activity Logs</h3>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Activity Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activity logs..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_TYPES.map(action => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date Range</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 border-b">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Select Date Range</h4>
                      <p className="text-xs text-muted-foreground">
                        Choose start and end dates to filter activity
                      </p>
                    </div>
                  </div>
                  <CalendarComponent
                    mode="range"
                    defaultMonth={startDate}
                    selected={{
                      from: startDate,
                      to: endDate
                    }}
                    onSelect={(range) => {
                      setStartDate(range?.from);
                      setEndDate(range?.to);
                      
                      updateFilters({
                        dateFrom: range?.from?.toISOString(),
                        dateTo: range?.to?.toISOString(),
                        offset: 0
                      });
                    }}
                    numberOfMonths={1}
                  />
                  <div className="p-3 border-t flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                        updateFilters({
                          dateFrom: undefined,
                          dateTo: undefined,
                          offset: 0
                        });
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleResetFilters}
                title="Reset filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleExportLogs}
                title="Export logs"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8 mb-3 opacity-50" />
                  <p>No activity logs found</p>
                  <p className="text-sm">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow 
                          key={log.id}
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setSelectedLog(log)}
                        >
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            {log.user?.full_name || 'Unknown user'}
                            <div className="text-xs text-muted-foreground">
                              {log.user?.email || 'No email'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getActionBadge(log.action_type)}
                          </TableCell>
                          <TableCell className="max-w-sm truncate">
                            {getActivityDescription(log)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {pagination.pageCount > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.pageSize, logs.length)} of{" "}
                    {pagination.pageCount * pagination.pageSize} entries
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                          aria-disabled={pagination.currentPage === 1}
                          className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, pagination.pageCount) }, (_, i) => {
                        let pageNum: number;
                        
                        // Logic for showing the correct page numbers
                        if (pagination.pageCount <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                          if (i === 4) return (
                            <PaginationItem key="ellipsis-end">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else if (pagination.currentPage >= pagination.pageCount - 2) {
                          pageNum = pagination.pageCount - 4 + i;
                          if (i === 0) return (
                            <PaginationItem key="ellipsis-start">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        } else {
                          if (i === 0) return (
                            <PaginationItem key="ellipsis-start">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          if (i === 4) return (
                            <PaginationItem key="ellipsis-end">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                          pageNum = pagination.currentPage - 1 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              isActive={pagination.currentPage === pageNum}
                              onClick={() => pagination.onPageChange(pageNum)}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                          aria-disabled={pagination.currentPage === pagination.pageCount}
                          className={pagination.currentPage === pagination.pageCount ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && <ActivityLogDetails log={selectedLog} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActivityLogsPage;
