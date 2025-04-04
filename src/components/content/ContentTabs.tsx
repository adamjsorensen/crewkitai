
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabContent from "./TabContent";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const tabValues = ["all", "marketing", "sales", "operations"];
  
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
      <ScrollArea className="w-full" orientation="horizontal">
        <TabsList className="inline-flex w-auto min-w-max">
          {tabValues.map((tabValue) => (
            <TabsTrigger 
              key={tabValue} 
              value={tabValue} 
              className="whitespace-nowrap touch-callout-none min-h-[2.75rem]"
            >
              {tabValue === "all" ? "All Content" : tabValue.charAt(0).toUpperCase() + tabValue.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
      
      {tabValues.map((tabValue) => (
        <TabsContent key={tabValue} value={tabValue} className="w-full max-w-full overflow-x-hidden">
          <TabContent 
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
