
import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface EmptyPromptStateProps {
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
}

const EmptyPromptState: React.FC<EmptyPromptStateProps> = ({
  onCreatePrompt
}) => {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">
        No prompts found in this hub. Create your first prompt or category.
      </p>
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => onCreatePrompt(null, true)}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Category
        </Button>
        <Button onClick={() => onCreatePrompt(null, false)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Prompt
        </Button>
      </div>
    </div>
  );
};

export default EmptyPromptState;
