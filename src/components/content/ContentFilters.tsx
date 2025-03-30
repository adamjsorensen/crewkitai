
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, XCircle } from "lucide-react";

interface ContentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
}

const ContentFilters = ({
  searchTerm,
  setSearchTerm,
  isFiltering,
  onClearFilters
}: ContentFiltersProps) => {
  return (
    <div className="flex gap-2 w-full md:w-auto">
      <div className="relative flex-1 md:w-[260px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search prompts..."
          className="pl-10 pr-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {isFiltering && (
        <Button variant="outline" onClick={onClearFilters} size="icon">
          <XCircle className="h-5 w-5" />
          <span className="sr-only">Clear filters</span>
        </Button>
      )}
    </div>
  );
};

export default ContentFilters;
