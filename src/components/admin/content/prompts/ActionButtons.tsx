
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Plus, FolderPlus, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActionButtonsProps {
  onCreateCategory: () => void;
  onCreatePrompt: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCreateCategory,
  onCreatePrompt
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-x-2">
      <Button 
        variant="outline" 
        onClick={onCreateCategory}
        className="gap-1.5 h-8 text-xs md:h-10 md:text-sm"
        size={isMobile ? "sm" : "default"}
      >
        {isMobile ? <FolderPlus className="h-3.5 w-3.5" /> : <PlusCircle className="h-4 w-4" />}
        <span className={isMobile ? "hidden sm:inline" : ""}>New Category</span>
        <span className={isMobile ? "sm:hidden" : "hidden"}>Category</span>
      </Button>
      
      <Button 
        onClick={onCreatePrompt}
        className="gap-1.5 h-8 text-xs md:h-10 md:text-sm"
        size={isMobile ? "sm" : "default"}
      >
        {isMobile ? <FileText className="h-3.5 w-3.5" /> : <PlusCircle className="h-4 w-4" />}
        <span className={isMobile ? "hidden sm:inline" : ""}>New Prompt</span>
        <span className={isMobile ? "sm:hidden" : "hidden"}>Prompt</span>
      </Button>
    </div>
  );
};

export default ActionButtons;
