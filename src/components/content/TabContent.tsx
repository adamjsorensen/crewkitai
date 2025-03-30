
import React from "react";
import ContentDisplay from "./ContentDisplay";
import { Prompt } from "@/hooks/useCrewkitPrompts";

interface TabContentProps {
  categories: Prompt[];
  prompts: Prompt[];
  isLoading: boolean;
  isError: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedPrompt: string | null;
  setSelectedPrompt: (id: string | null) => void;
  isFiltering: boolean;
  onCategoryClick: (category: Prompt) => void;
}

const TabContent = ({
  categories,
  prompts,
  isLoading,
  isError,
  selectedCategory,
  setSelectedCategory,
  selectedPrompt,
  setSelectedPrompt,
  isFiltering,
  onCategoryClick
}: TabContentProps) => {
  return (
    <div className="mt-6">
      <ContentDisplay 
        categories={categories}
        prompts={prompts}
        isLoading={isLoading}
        isError={isError}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPrompt={selectedPrompt}
        setSelectedPrompt={setSelectedPrompt}
        isFiltering={isFiltering}
        onCategoryClick={onCategoryClick}
      />
    </div>
  );
};

export default TabContent;
