
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
    <Card className={`mb-4 ${isCategory ? "border-l-4 border-l-primary" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isCategory ? (
              <FolderOpen className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <CardTitle className="text-lg line-clamp-1">{prompt.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {isCategory && hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle(prompt.id)}
                className="px-2"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                <span className="hidden sm:inline">{isExpanded ? "Collapse" : "Expand"}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(prompt)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(prompt)}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {prompt.description && (
          <CardDescription className="line-clamp-2">{prompt.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
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
                <span className="hidden xs:inline">Add</span> Category
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={() => onCreatePrompt(prompt.id, false)}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span className="hidden xs:inline">Add</span> Prompt
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptCard;
