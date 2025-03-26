
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
import { CalendarIcon, Clock, Download, Search, X } from "lucide-react";
import { format } from "date-fns";
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
import { ActivityLogDetails } from "@/components/user-management/ActivityLogDetails";
import { ActivityLogRow } from "@/components/user-management/ActivityLogRow";

const ACTION_TYPES = [
  { value: "all", label: "All Activities" },
  { value: "chat_message", label: "Chat Messages" },
  { value: "chat_response", label: "AI Responses" },
  { value: "compass_analyze", label: "Compass Analysis" },
  { value: "content_generated", label: "Generated Content" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "profile_update", label: "Profile Update" },
  { value: "delete_user", label: "User Deletion" },
  { value: "bulk_delete_users", label: "Bulk User Deletion" },
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Activity Logs</h2>
          <Badge variant="outline" className="ml-2">
            {logs.length} Records
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
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing page {pagination.currentPage} of {pagination.pageCount}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => pagination.currentPage > 1 ? 
                    pagination.onPageChange(pagination.currentPage - 1) : undefined
                  }
                  className={pagination.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  aria-disabled={pagination.currentPage === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => pagination.currentPage < pagination.pageCount ? 
                    pagination.onPageChange(pagination.currentPage + 1) : undefined
                  }
                  className={pagination.currentPage === pagination.pageCount ? "pointer-events-none opacity-50" : ""}
                  aria-disabled={pagination.currentPage === pagination.pageCount}
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
  );
};

export default ActivityLogsPage;
