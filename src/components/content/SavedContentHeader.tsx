
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle } from "lucide-react";

interface SavedContentHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SavedContentHeader = ({ searchTerm, setSearchTerm }: SavedContentHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Saved Content</h1>
        <p className="text-muted-foreground">
          Access and manage your saved content
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search content..."
            className="pl-10 w-full sm:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => navigate("/dashboard/content")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New
        </Button>
      </div>
    </div>
  );
};

export default SavedContentHeader;
