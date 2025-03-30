
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
    <div className="space-x-2">
      <Button 
        variant="outline" 
        onClick={onCreateCategory}
        className="gap-1.5"
      >
        <PlusCircle className="h-4 w-4" />
        <span>New Category</span>
      </Button>
      
      <Button 
        onClick={onCreatePrompt}
        className="gap-1.5"
      >
        <PlusCircle className="h-4 w-4" />
        <span>New Prompt</span>
      </Button>
    </div>
  );
};

export default ActionButtons;
