
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { PromptCard } from "@/components/content/PromptCard";
import { CategoryTile } from "@/components/content/CategoryTile";
import { CustomPromptWizard } from "@/components/content/CustomPromptWizard";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, XCircle } from "lucide-react";

const PromptLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  
  // Load prompts with the updated useCrewkitPrompts hook
  const { prompts, categories, isLoading, isError } = useCrewkitPrompts();
  
  // Filter prompts based on search term and category
  const filteredPrompts = React.useMemo(() => {
    if (!prompts) return [];
    
    return prompts.filter(prompt => {
      // Filter by search term
      const matchesSearch = searchTerm === "" ||
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by selected category
      const matchesCategory = !selectedCategory || prompt.parent_id === selectedCategory;
      
      // Filter by active tab
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'marketing' && prompt.hub_area === 'marketing') ||
        (activeTab === 'sales' && prompt.hub_area === 'sales') ||
        (activeTab === 'operations' && prompt.hub_area === 'operations');
      
      return matchesSearch && matchesCategory && matchesTab && !prompt.is_category;
    });
  }, [prompts, searchTerm, selectedCategory, activeTab]);
  
  // Filter categories based on active tab
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
  
  const isFiltering = searchTerm !== "" || selectedCategory !== null;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Creation</h1>
            <p className="text-muted-foreground">
              Generate professional content for your painting business
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-[260px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search prompts..."
                className="pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isFiltering && (
              <Button variant="outline" onClick={handleClearFilters} size="icon">
                <XCircle className="h-5 w-5" />
                <span className="sr-only">Clear filters</span>
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Content</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <ContentDisplay 
              categories={filteredCategories}
              prompts={filteredPrompts}
              isLoading={isLoading}
              isError={isError}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedPrompt={selectedPrompt}
              setSelectedPrompt={setSelectedPrompt}
              isFiltering={isFiltering}
            />
          </TabsContent>
          
          <TabsContent value="marketing" className="mt-6">
            <ContentDisplay 
              categories={filteredCategories}
              prompts={filteredPrompts}
              isLoading={isLoading}
              isError={isError}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedPrompt={selectedPrompt}
              setSelectedPrompt={setSelectedPrompt}
              isFiltering={isFiltering}
            />
          </TabsContent>
          
          <TabsContent value="sales" className="mt-6">
            <ContentDisplay 
              categories={filteredCategories}
              prompts={filteredPrompts}
              isLoading={isLoading}
              isError={isError}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedPrompt={selectedPrompt}
              setSelectedPrompt={setSelectedPrompt}
              isFiltering={isFiltering}
            />
          </TabsContent>
          
          <TabsContent value="operations" className="mt-6">
            <ContentDisplay 
              categories={filteredCategories}
              prompts={filteredPrompts}
              isLoading={isLoading}
              isError={isError}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedPrompt={selectedPrompt}
              setSelectedPrompt={setSelectedPrompt}
              isFiltering={isFiltering}
            />
          </TabsContent>
        </Tabs>
        
        {/* Custom Prompt Wizard Dialog */}
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

interface ContentDisplayProps {
  categories: any[];
  prompts: any[];
  isLoading: boolean;
  isError: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedPrompt: string | null;
  setSelectedPrompt: (id: string | null) => void;
  isFiltering: boolean;
}

const ContentDisplay = ({
  categories,
  prompts,
  isLoading,
  isError,
  selectedCategory,
  setSelectedCategory,
  selectedPrompt,
  setSelectedPrompt,
  isFiltering
}: ContentDisplayProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[180px] rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-2">Error loading content templates</p>
          <Button variant="outline">Try Again</Button>
        </CardContent>
      </Card>
    );
  }
  
  if (categories.length === 0 && prompts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-2">
            {isFiltering 
              ? "No content templates match your filters" 
              : "No content templates available"}
          </p>
          {isFiltering && (
            <Button variant="outline" onClick={() => setSelectedCategory(null)}>
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // If a category is selected, show prompts from that category
  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedCategory(null)}
              className="text-muted-foreground"
            >
              ← Back
            </Button>
            <h2 className="text-xl font-semibold">
              {categories.find(cat => cat.id === selectedCategory)?.title || "Category"}
            </h2>
          </div>
        </div>
        
        {prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                id={prompt.id}
                title={prompt.title}
                description={prompt.description || ""}
                iconName={prompt.icon_name}
                onClick={() => setSelectedPrompt(prompt.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No prompts in this category</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
  
  // Display categories and prompts
  return (
    <div className="space-y-6">
      {categories.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-2">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(category => (
              <CategoryTile
                key={category.id}
                id={category.id}
                title={category.title}
                description={category.description || ""}
                iconName={category.icon_name}
                onClick={() => setSelectedCategory(category.id)}
              />
            ))}
          </div>
          
          {prompts.length > 0 && <Separator className="my-6" />}
        </>
      )}
      
      {prompts.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-2">Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                id={prompt.id}
                title={prompt.title}
                description={prompt.description || ""}
                iconName={prompt.icon_name}
                onClick={() => setSelectedPrompt(prompt.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PromptLibrary;
