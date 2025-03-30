
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryTile from "@/components/content/CategoryTile";
import PromptCard from "@/components/content/PromptCard";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface ContentDisplayProps {
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

const ContentDisplay = ({
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
}: ContentDisplayProps) => {
  if (isLoading) {
    return (
      <div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[180px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-medium mb-2 text-red-700">Error Loading Content</h3>
          <p className="text-red-600 mb-4">There was a problem loading content templates. Please try again later.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
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
  
  if (selectedCategory) {
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h2 className="text-xl font-semibold">
              {selectedCategoryData?.title || "Category"}
            </h2>
          </div>
        </div>
        
        {selectedCategoryData?.description && (
          <p className="text-muted-foreground">{selectedCategoryData.description}</p>
        )}
        
        {prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSelect={() => setSelectedPrompt(prompt.id)}
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
  
  return (
    <div className="space-y-6">
      {categories.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-2">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(category => (
              <CategoryTile
                key={category.id}
                category={category}
                onClick={onCategoryClick}
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
                prompt={prompt}
                onSelect={() => setSelectedPrompt(prompt.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ContentDisplay;
