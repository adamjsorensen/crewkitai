
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  FileText, 
  Folders, 
  Loader, 
  Search 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import PromptCard from "@/components/content/PromptCard";
import CategoryCard from "@/components/content/CategoryCard";

const PromptLibraryPage = () => {
  const [activeHub, setActiveHub] = useState<string>("marketing");
  const [currentCategory, setCurrentCategory] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  // When at root level, get root prompts and categories
  const { prompts: rootItems, isLoading: isLoadingRoot } = useCrewkitPrompts(
    currentCategory?.id || null
  );
  
  // Filter by hub area when at root level
  const filteredItems = React.useMemo(() => {
    if (currentCategory) {
      // When in a category, show all items in that category
      return rootItems;
    } else {
      // At root level, filter by hub
      return rootItems.filter(item => 
        !item.hub_area || // Show categories without hub_area
        item.hub_area === activeHub // Show prompts matching current hub
      );
    }
  }, [rootItems, activeHub, currentCategory]);
  
  // Further filter by search query if present
  const searchFilteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredItems;
    }
    
    const query = searchQuery.toLowerCase();
    return filteredItems.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.description || "").toLowerCase().includes(query)
    );
  }, [filteredItems, searchQuery]);
  
  // Separate categories and prompts
  const categories = searchFilteredItems.filter(item => item.is_category);
  const prompts = searchFilteredItems.filter(item => !item.is_category);
  
  const handleCategoryClick = (category: Prompt) => {
    setCurrentCategory(category);
    setSearchQuery(""); // Clear search when navigating
  };
  
  const handleBackClick = () => {
    setCurrentCategory(null);
  };
  
  const breadcrumb = (
    <div className="flex items-center mb-6">
      {currentCategory && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 mr-2" 
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
      )}
      <div className="flex items-center text-muted-foreground text-sm">
        <span className="cursor-pointer hover:text-foreground" onClick={() => setCurrentCategory(null)}>
          Prompt Library
        </span>
        {currentCategory && (
          <>
            <span className="mx-2">/</span>
            <span className="font-medium text-foreground">{currentCategory.title}</span>
          </>
        )}
      </div>
    </div>
  );
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Prompt Library</h1>
          <p className="text-muted-foreground">
            Browse and select content prompts tailored for painting professionals
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          {breadcrumb}
          
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search prompts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {!currentCategory && (
          <Tabs value={activeHub} onValueChange={setActiveHub}>
            <TabsList>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="client_communications">Client Communications</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        {isLoadingRoot ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-3">Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <CategoryCard 
                      key={category.id} 
                      category={category} 
                      onClick={() => handleCategoryClick(category)} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Divider if both categories and prompts exist */}
            {categories.length > 0 && prompts.length > 0 && (
              <Separator />
            )}
            
            {/* Prompts */}
            {prompts.length > 0 ? (
              <div>
                <h2 className="text-lg font-medium mb-3">Prompts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {prompts.map(prompt => (
                    <PromptCard 
                      key={prompt.id} 
                      prompt={prompt} 
                      onClick={() => navigate(`/dashboard/prompt/${prompt.id}`)} 
                    />
                  ))}
                </div>
              </div>
            ) : searchQuery && filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No prompts found matching "{searchQuery}"</p>
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </div>
            ) : !currentCategory && categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No prompts available in this hub area</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PromptLibraryPage;
