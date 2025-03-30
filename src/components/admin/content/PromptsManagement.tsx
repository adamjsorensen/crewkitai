
import React, { useState } from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import EditPromptDialog from "./EditPromptDialog";
import PromptsList from "./prompts/PromptsList";
import EmptyPromptState from "./prompts/EmptyPromptState";
import LoadingState from "./prompts/LoadingState";
import DeletePromptDialog from "./prompts/DeletePromptDialog";

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

  // Render appropriate component based on loading state and data availability
  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (prompts.length === 0) {
      return <EmptyPromptState onCreatePrompt={onCreatePrompt} />;
    }

    return (
      <PromptsList
        prompts={prompts}
        expandedCategories={expandedCategories}
        onToggleCategory={toggleCategory}
        onEditPrompt={handleEdit}
        onDeletePrompt={handleDelete}
        onCreatePrompt={onCreatePrompt}
      />
    );
  };

  return (
    <div>
      {renderContent()}

      {/* Delete Dialog */}
      <DeletePromptDialog
        promptToDelete={promptToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPromptToDelete(null);
        }}
        onConfirmDelete={confirmDelete}
      />

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
