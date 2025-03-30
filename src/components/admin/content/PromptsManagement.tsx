
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Pencil, Trash2, FolderOpen, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import EditPromptDialog from "./EditPromptDialog";

type PromptsManagementProps = {
  hub: string;
  prompts: Prompt[];
  isLoading: boolean;
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
};

const PromptsManagement = ({
  hub,
  prompts,
  isLoading,
  onCreatePrompt,
}: PromptsManagementProps) => {
  const { deletePrompt } = useCrewkitPrompts();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleEdit = (prompt: Prompt) => {
    setPromptToEdit(prompt.id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (prompt: Prompt) => {
    setPromptToDelete(prompt);
  };

  const confirmDelete = async () => {
    if (promptToDelete) {
      await deletePrompt.mutateAsync(promptToDelete.id);
      setPromptToDelete(null);
    }
  };

  const renderPrompts = (promptsList: Prompt[], parentId: string | null = null) => {
    return promptsList
      .filter((p) => p.parent_id === parentId)
      .map((prompt) => {
        const isCategory = prompt.is_category;
        const hasChildren = prompts.some((p) => p.parent_id === prompt.id);
        const isExpanded = expandedCategories.includes(prompt.id);

        return (
          <React.Fragment key={prompt.id}>
            <Card className={`mb-4 ${isCategory ? "border-l-4 border-l-primary" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isCategory ? (
                      <FolderOpen className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-lg">{prompt.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCategory && hasChildren && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(prompt.id)}
                      >
                        {isExpanded ? "Collapse" : "Expand"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prompt)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {prompt.description && (
                  <CardDescription>{prompt.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  {isCategory && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onCreatePrompt(prompt.id, true)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Category
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs"
                        onClick={() => onCreatePrompt(prompt.id, false)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add Prompt
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {isCategory && isExpanded && (
              <div className="pl-6 border-l border-dashed border-gray-300 mb-4">
                {renderPrompts(prompts, prompt.id)}
              </div>
            )}
          </React.Fragment>
        );
      });
  };

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : prompts.length === 0 ? (
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
      ) : (
        renderPrompts(prompts)
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!promptToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPromptToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {promptToDelete?.is_category ? "Category" : "Prompt"}</AlertDialogTitle>
            <AlertDialogDescription>
              {promptToDelete?.is_category
                ? "This will delete the category and all nested prompts and categories. This action cannot be undone."
                : "This will permanently delete this prompt and any associated parameter rules. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <EditPromptDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        promptId={promptToEdit}
      />
    </div>
  );
};

export default PromptsManagement;
