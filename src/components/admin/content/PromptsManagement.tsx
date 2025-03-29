
import React, { useState } from "react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, FolderOpen, FileText, Pencil, Trash, Loader, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface PromptsManagementProps {
  hub: string;
  prompts: Prompt[];
  isLoading: boolean;
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
}

const PromptsManagement = ({ hub, prompts, isLoading, onCreatePrompt }: PromptsManagementProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; promptId: string | null }>({
    open: false, 
    promptId: null
  });
  const { deletePrompt } = useCrewkitPrompts();
  const { toast } = useToast();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleDeleteClick = (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ open: true, promptId });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm.promptId) {
      deletePrompt.mutate(deleteConfirm.promptId, {
        onSuccess: () => {
          setDeleteConfirm({ open: false, promptId: null });
        },
        onError: (error) => {
          toast({
            title: "Error deleting prompt",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };

  const renderPromptItems = (items: Prompt[], parentId: string | null = null) => {
    const filteredItems = items.filter(item => 
      item.parent_id === parentId && 
      (item.hub_area === hub || (item.is_category && !item.hub_area))
    );

    if (filteredItems.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          {parentId 
            ? "No items in this category. Add some prompts or subcategories."
            : "No prompts or categories found. Start by creating a new prompt or category."}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div key={item.id}>
            <Card
              className={`transition-colors hover:bg-accent/50 ${item.is_category ? 'cursor-pointer' : ''}`}
              onClick={item.is_category ? () => toggleCategory(item.id) : undefined}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.is_category ? (
                      <>
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <span className="font-medium">{item.title}</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span>{item.title}</span>
                      </>
                    )}
                    {item.hub_area && (
                      <Badge variant="outline" className="ml-2 text-xs capitalize">
                        {item.hub_area}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {item.is_category && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreatePrompt(item.id, false);
                        }}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDeleteClick(item.id, e)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                    {item.is_category && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            expandedCategories[item.id] ? "rotate-90" : ""
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Render nested items if category is expanded */}
            {item.is_category && expandedCategories[item.id] && (
              <div className="ml-6 mt-3">
                {renderPromptItems(prompts, item.id)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-1.5"
                  onClick={() => onCreatePrompt(item.id, true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Subcategory</span>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {renderPromptItems(prompts)}
      </div>
      
      <AlertDialog 
        open={deleteConfirm.open} 
        onOpenChange={(isOpen) => 
          setDeleteConfirm({ ...deleteConfirm, open: isOpen })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this prompt and all its contents. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PromptsManagement;
