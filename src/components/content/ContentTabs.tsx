
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentDisplay from "./ContentDisplay";
import { Prompt } from "@/hooks/useCrewkitPrompts";

interface ContentTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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

const ContentTabs = ({
  activeTab,
  setActiveTab,
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
}: ContentTabsProps) => {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="all">All Content</TabsTrigger>
        <TabsTrigger value="marketing">Marketing</TabsTrigger>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
      </TabsList>
      
      {["all", "marketing", "sales", "operations"].map((tabValue) => (
        <TabsContent key={tabValue} value={tabValue} className="mt-6">
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
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ContentTabs;
