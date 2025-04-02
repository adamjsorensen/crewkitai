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
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Download, Search, X } from "lucide-react";
import { format } from "date-fns";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLogs";
import { ActivityLogListSkeleton } from "@/components/admin/logs/ActivityLogsSkeleton";
import { ActivityLogDetails } from "@/components/admin/logs/ActivityLogDetails";
import { ActivityLogRow } from "@/components/admin/logs/ActivityLogRow";
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AdminLayout from "@/components/admin/AdminLayout";
import { useLocation } from "react-router-dom";

const ACTION_TYPES = [
  { value: "all", label: "All Activities" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "profile_update", label: "Profile Update" },
  { value: "update_user", label: "User Update (Admin)" },
  { value: "delete_user", label: "User Deletion" },
  { value: "bulk_delete_users", label: "Bulk User Deletion" },
  { value: "reset_password", label: "Password Reset" },
  { value: "chat_message", label: "Chat Messages" },
  { value: "chat_response", label: "AI Responses" },
  { value: "content_generated", label: "Generated Content" },
  { value: "content_modified", label: "Modified Content" },
  { value: "content_generation_prompt", label: "Content Generation Prompts" },
  { value: "compass_analyze", label: "Compass Analysis" },
];

const ActivityLogsPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialUserId = queryParams.get("user");

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
  } = useActivityLogs({
    limit: 10, 
    userId: initialUserId || undefined,
    dateFrom: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
    dateTo: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
  });

  React.useEffect(() => {
    updateFilters({ userId: initialUserId || undefined });
  }, [initialUserId, updateFilters]);

  const handleSearch = () => {
    console.log("Search term applied (not implemented yet):", searchTerm);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom(undefined);
    setDateTo(undefined);
    updateFilters({
      actionType: undefined,
      userId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const handleExport = () => {
    console.log(`Exporting as ${exportFormat} (not implemented yet)`);
    setShowExportOptions(false);
  };

  const areFiltersActive = 
    filters.actionType !== 'all' || 
    !!filters.userId || 
    !!filters.dateFrom || 
    !!filters.dateTo ||
    searchTerm !== "";

  return (
    <AdminLayout 
      title="Activity Logs"
      description="Monitor user and system activities."
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs (user email/action)..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            
            <Select
              value={filters.actionType || "all"}
              onValueChange={(value) => updateFilters({ actionType: value === 'all' ? undefined : value })}
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
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal text-xs px-2"
                  size="sm"
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {dateFrom ? format(dateFrom, "MM/dd/yy") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    setIsFromOpen(false);
                    updateFilters({ dateFrom: date ? format(date, "yyyy-MM-dd") : undefined });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover open={isToOpen} onOpenChange={setIsToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal text-xs px-2"
                  size="sm"
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {dateTo ? format(dateTo, "MM/dd/yy") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    setIsToOpen(false);
                    updateFilters({ dateTo: date ? format(date, "yyyy-MM-dd") : undefined });
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

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

            {areFiltersActive ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost"
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

        {showExportOptions && (
          <div className="flex justify-end gap-2 p-2 border rounded-md bg-muted">
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
              Download Export
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowExportOptions(false)}>Cancel</Button>
          </div>
        )}

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
                  <ActivityLogListSkeleton rows={pagination.pageSize} /> 
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No activity logs found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <ActivityLogRow 
                      key={log.id} 
                      log={log}
                      onClick={() => setSelectedLog(log)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {pagination.pageCount > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
            <div className="text-xs text-muted-foreground">
              Page {pagination.currentPage} of {pagination.pageCount}
            </div>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => pagination.currentPage > 1 ? 
                      pagination.onPageChange(pagination.currentPage - 1) : undefined
                    }
                    className={pagination.currentPage === 1 ? "pointer-events-none opacity-50 cursor-default" : "cursor-pointer"}
                    aria-disabled={pagination.currentPage === 1}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => pagination.currentPage < pagination.pageCount ? 
                      pagination.onPageChange(pagination.currentPage + 1) : undefined
                    }
                    className={pagination.currentPage === pagination.pageCount ? "pointer-events-none opacity-50 cursor-default" : "cursor-pointer"}
                    aria-disabled={pagination.currentPage === pagination.pageCount}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => pagination.onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[80px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Activity Log Details</DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <ActivityLogDetails log={selectedLog} /> 
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ActivityLogsPage; 