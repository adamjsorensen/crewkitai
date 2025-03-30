
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Prompt } from "@/hooks/useCrewkitPrompts";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryTile from "@/components/content/CategoryTile";
import PromptCard from "@/components/content/PromptCard";
import { Separator } from "@/components/ui/separator";

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
