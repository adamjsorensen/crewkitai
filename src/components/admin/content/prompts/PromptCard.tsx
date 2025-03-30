
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Pencil, Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { useIsMobile } from "@/hooks/use-mobile";

interface PromptCardProps {
  prompt: Prompt;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: (promptId: string) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  isExpanded,
  hasChildren,
  onToggle,
  onEdit,
  onDelete,
  onCreatePrompt
}) => {
  const isCategory = prompt.is_category;
  const isMobile = useIsMobile();

  return (
    <Card className={`mb-3 ${isCategory ? "border-l-4 border-l-primary" : ""} w-full`}>
      <CardHeader className="pb-1 pt-2 px-2 sm:pb-2 sm:pt-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            {isCategory ? (
              <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            )}
            <CardTitle className="text-sm sm:text-base truncate">{prompt.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {isCategory && hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onToggle(prompt.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEdit(prompt)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onDelete(prompt)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {prompt.description && (
          <CardDescription className="text-xs line-clamp-2 mt-1">{prompt.description}</CardDescription>
        )}
      </CardHeader>
      {isCategory && (
        <CardContent className="px-2 py-1 sm:px-4 sm:py-2">
          <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => onCreatePrompt(prompt.id, true)}
            >
              {isMobile ? <Plus className="h-3 w-3 mr-1" /> : <FolderOpen className="h-3.5 w-3.5 mr-1" />}
              <span className={isMobile ? "hidden" : "inline"}>Add Category</span>
              <span className={isMobile ? "inline" : "hidden"}>Cat</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => onCreatePrompt(prompt.id, false)}
            >
              {isMobile ? <Plus className="h-3 w-3 mr-1" /> : <FileText className="h-3.5 w-3.5 mr-1" />}
              <span className={isMobile ? "hidden" : "inline"}>Add Prompt</span>
              <span className={isMobile ? "inline" : "hidden"}>Prompt</span>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default PromptCard;
