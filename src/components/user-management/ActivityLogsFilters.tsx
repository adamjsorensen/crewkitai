
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Search, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityLogsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  actionType: string;
  setActionType: (value: string) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onExport: () => void;
}

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

export const ActivityLogsFilters: React.FC<ActivityLogsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  actionType,
  setActionType,
  onSearch,
  onClearFilters,
  onExport,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="relative flex-grow sm:flex-grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs..."
          className="pl-8 w-full sm:w-[200px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
      </div>
      
      <Select
        value={actionType}
        onValueChange={setActionType}
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
              onClick={onExport}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export logs</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {actionType !== "all" || searchTerm ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                onClick={onClearFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear filters</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );
};
