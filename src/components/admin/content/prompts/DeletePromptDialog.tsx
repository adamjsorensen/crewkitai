
import React from "react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface DeletePromptDialogProps {
  promptToDelete: Prompt | null;
  onOpenChange: (isOpen: boolean) => void;
  onConfirmDelete: () => Promise<void>;
}

const DeletePromptDialog: React.FC<DeletePromptDialogProps> = ({
  promptToDelete,
  onOpenChange,
  onConfirmDelete
}) => {
  return (
    <AlertDialog
      open={!!promptToDelete}
      onOpenChange={(isOpen) => {
        if (!isOpen) onOpenChange(false);
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
          <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePromptDialog;
