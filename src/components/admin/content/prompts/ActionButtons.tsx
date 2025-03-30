
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ActionButtonsProps {
  onCreateCategory: () => void;
  onCreatePrompt: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCreateCategory,
  onCreatePrompt
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button 
        variant="outline" 
        onClick={onCreateCategory}
        className="gap-1.5 w-full sm:w-auto justify-center min-h-[2.75rem]"
      >
        <PlusCircle className="h-4 w-4 shrink-0" />
        <span className="truncate">New Category</span>
      </Button>
      
      <Button 
        onClick={onCreatePrompt}
        className="gap-1.5 w-full sm:w-auto justify-center min-h-[2.75rem]"
      >
        <PlusCircle className="h-4 w-4 shrink-0" />
        <span className="truncate">New Prompt</span>
      </Button>
    </div>
  );
};

export default ActionButtons;
