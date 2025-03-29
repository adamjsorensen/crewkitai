
import React from "react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash, Folders, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type PromptsManagementProps = {
  hub: string;
  prompts: Prompt[];
  isLoading: boolean;
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
};

const PromptsManagement = ({ hub, prompts, isLoading, onCreatePrompt }: PromptsManagementProps) => {
  const { toast } = useToast();
  const { deletePrompt } = useCrewkitPrompts();
  
  const rootCategories = prompts.filter(p => p.is_category && !p.parent_id);
  const rootPrompts = prompts.filter(p => !p.is_category && !p.parent_id && p.hub_area === hub);
  
  const handleDeletePrompt = (promptId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deletePrompt.mutate(promptId, {
        onSuccess: () => {
          toast({
            title: "Prompt deleted",
            description: `"${title}" has been deleted successfully.`,
          });
        }
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (rootCategories.length === 0 && rootPrompts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No prompts yet</CardTitle>
          <CardDescription>
            Get started by creating categories and prompts for this hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button onClick={() => onCreatePrompt(null, true)} variant="outline" size="sm">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              New Category
            </Button>
            <Button onClick={() => onCreatePrompt(null, false)} size="sm">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              New Prompt
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Categories Section */}
      {rootCategories.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rootCategories.map(category => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                onCreatePrompt={onCreatePrompt}
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Prompts Section */}
      {rootPrompts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rootPrompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryCard = ({ 
  category, 
  onCreatePrompt,
  onDelete
}: { 
  category: Prompt; 
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
  onDelete: (id: string, title: string) => void;
}) => {
  // Fetch child prompts and categories
  const { prompts: childPrompts, isLoading } = useCrewkitPrompts(category.id);
  
  const childCategories = childPrompts.filter(p => p.is_category);
  const actualPrompts = childPrompts.filter(p => !p.is_category);
  
  return (
    <Card className="relative overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Folders className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base truncate">{category.title}</CardTitle>
          </div>
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(category.id, category.title)}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {category.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {category.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs px-1">
              {`${childCategories.length} categories`}
            </Badge>
            <Badge variant="outline" className="text-xs px-1">
              {`${actualPrompts.length} prompts`}
            </Badge>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 text-xs flex items-center gap-1.5"
            onClick={() => onCreatePrompt(category.id, true)}
          >
            <PlusCircle className="h-3 w-3" />
            <span>Add Category</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 text-xs flex items-center gap-1.5"
            onClick={() => onCreatePrompt(category.id, false)}
          >
            <PlusCircle className="h-3 w-3" />
            <span>Add Prompt</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const PromptCard = ({ 
  prompt, 
  onDelete
}: { 
  prompt: Prompt; 
  onDelete: (id: string, title: string) => void;
}) => {
  return (
    <Card className="relative overflow-hidden group">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base truncate">{prompt.title}</CardTitle>
          </div>
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive"
              onClick={() => onDelete(prompt.id, prompt.title)}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {prompt.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {prompt.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="h-24 overflow-hidden text-xs text-muted-foreground opacity-70">
        <ScrollArea className="h-full">
          {prompt.prompt ? (
            <div className="font-mono">{prompt.prompt.substring(0, 300)}{prompt.prompt.length > 300 ? '...' : ''}</div>
          ) : (
            <div className="italic">No prompt content</div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PromptsManagement;
