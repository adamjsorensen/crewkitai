
import React from "react";
import ContentFilters from "./ContentFilters";

interface ContentPageHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
}

const ContentPageHeader = ({
  searchTerm,
  setSearchTerm,
  isFiltering,
  onClearFilters
}: ContentPageHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Creation</h1>
        <p className="text-muted-foreground">
          Generate professional content for your painting business
        </p>
      </div>
      
      <ContentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isFiltering={isFiltering}
        onClearFilters={onClearFilters}
      />
    </div>
  );
};

export default ContentPageHeader;
