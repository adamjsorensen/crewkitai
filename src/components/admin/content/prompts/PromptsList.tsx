
import React from "react";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import PromptCard from "./PromptCard";

interface PromptsListProps {
  prompts: Prompt[];
  expandedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (prompt: Prompt) => void;
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
  parentId?: string | null;
}

const PromptsList: React.FC<PromptsListProps> = ({
  prompts,
  expandedCategories,
  onToggleCategory,
  onEditPrompt,
  onDeletePrompt,
  onCreatePrompt,
  parentId = null
}) => {
  return (
    <div className="w-full overflow-x-hidden">
      {prompts
        .filter((p) => p.parent_id === parentId)
        .map((prompt) => {
          const isCategory = prompt.is_category;
          const hasChildren = prompts.some((p) => p.parent_id === prompt.id);
          const isExpanded = expandedCategories.includes(prompt.id);

          return (
            <React.Fragment key={prompt.id}>
              <PromptCard
                prompt={prompt}
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                onToggle={onToggleCategory}
                onEdit={onEditPrompt}
                onDelete={onDeletePrompt}
                onCreatePrompt={onCreatePrompt}
              />

              {isCategory && isExpanded && (
                <div className="pl-4 md:pl-6 border-l border-dashed border-gray-300 mb-4 overflow-x-hidden">
                  <PromptsList
                    prompts={prompts}
                    expandedCategories={expandedCategories}
                    onToggleCategory={onToggleCategory}
                    onEditPrompt={onEditPrompt}
                    onDeletePrompt={onDeletePrompt}
                    onCreatePrompt={onCreatePrompt}
                    parentId={prompt.id}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
    </div>
  );
};

export default PromptsList;
