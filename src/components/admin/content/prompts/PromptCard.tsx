
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Prompt } from "@/hooks/useCrewkitPrompts";

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

  return (
    <Card className={`mb-4 ${isCategory ? "border-l-4 border-l-primary" : ""} w-full`}>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isCategory ? (
              <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            )}
            <CardTitle className="text-base sm:text-lg truncate">{prompt.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {isCategory && hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex text-xs"
                onClick={() => onToggle(prompt.id)}
              >
                {isExpanded ? "Collapse" : "Expand"}
              </Button>
            )}
            {isCategory && hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="flex sm:hidden"
                onClick={() => onToggle(prompt.id)}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(prompt)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(prompt)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {prompt.description && (
          <CardDescription className="text-xs sm:text-sm line-clamp-2">{prompt.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-3 sm:px-6 py-2">
        <div className="flex flex-wrap justify-end gap-2">
          {isCategory && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onCreatePrompt(prompt.id, true)}
              >
                <FolderOpen className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">Category</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={() => onCreatePrompt(prompt.id, false)}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Add Prompt</span>
                <span className="sm:hidden">Prompt</span>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptCard;
