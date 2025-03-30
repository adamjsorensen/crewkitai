
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CustomPromptWizard from "@/components/content/CustomPromptWizard";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import ContentPageHeader from "@/components/content/ContentPageHeader";
import ContentTabs from "@/components/content/ContentTabs";

const ContentPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const { prompts, isLoading, isError } = useCrewkitPrompts();
  
  const categories = React.useMemo(() => {
    if (!prompts) return [];
    return prompts.filter(prompt => prompt.is_category === true);
  }, [prompts]);
  
  const filteredPrompts = React.useMemo(() => {
    if (!prompts) return [];
    
    return prompts.filter(prompt => {
      const matchesSearch = searchTerm === "" ||
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || prompt.parent_id === selectedCategory;
      
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'marketing' && prompt.hub_area === 'marketing') ||
        (activeTab === 'sales' && prompt.hub_area === 'sales') ||
        (activeTab === 'operations' && prompt.hub_area === 'operations');
      
      return matchesSearch && matchesCategory && matchesTab && !prompt.is_category;
    });
  }, [prompts, searchTerm, selectedCategory, activeTab]);
  
  const filteredCategories = React.useMemo(() => {
    if (!categories) return [];
    
    return categories.filter(category => {
      return activeTab === 'all' || 
        (activeTab === 'marketing' && category.hub_area === 'marketing') ||
        (activeTab === 'sales' && category.hub_area === 'sales') ||
        (activeTab === 'operations' && category.hub_area === 'operations');
    });
  }, [categories, activeTab]);
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category: Prompt) => {
    setSelectedCategory(category.id);
  };
  
  const isFiltering = searchTerm !== "" || selectedCategory !== null;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <ContentPageHeader 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isFiltering={isFiltering}
          onClearFilters={handleClearFilters}
        />
        
        <ContentTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          categories={filteredCategories}
          prompts={filteredPrompts}
          isLoading={isLoading}
          isError={isError}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedPrompt={selectedPrompt}
          setSelectedPrompt={setSelectedPrompt}
          isFiltering={isFiltering}
          onCategoryClick={handleCategorySelect}
        />
        
        {selectedPrompt && (
          <CustomPromptWizard
            promptId={selectedPrompt}
            isOpen={!!selectedPrompt}
            onClose={() => setSelectedPrompt(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContentPage;
