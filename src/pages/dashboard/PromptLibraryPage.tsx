
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { FileText, FolderOpen, Loader, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PromptLibraryPage = () => {
  const navigate = useNavigate();
  const [activeHub, setActiveHub] = useState<string>("marketing");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { prompts: allPrompts, isLoading } = useCrewkitPrompts();
  
  // Filter prompts by hub area and search query
  const filteredPrompts = allPrompts.filter(prompt => {
    const matchesHub = 
      !prompt.is_category && 
      (!prompt.hub_area || prompt.hub_area === activeHub);
    
    const matchesSearch = searchQuery 
      ? prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      : true;
    
    return matchesHub && matchesSearch;
  });

  const handlePromptClick = (promptId: string) => {
    navigate(`/dashboard/prompt/${promptId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Content Generator</h1>
          <p className="text-muted-foreground">
            Create professional content for your painting business using AI
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search prompts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue="marketing" onValueChange={setActiveHub}>
          <TabsList className="mb-6">
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="client_communications">Client Comm.</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>
          
          {['marketing', 'sales', 'operations', 'client_communications', 'general'].map((hub) => (
            <TabsContent key={hub} value={hub}>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="text-center p-12 border rounded-lg">
                  <p className="text-muted-foreground mb-2">
                    {searchQuery 
                      ? "No prompts found matching your search query." 
                      : "No prompts available in this category yet."}
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPrompts.map((prompt) => (
                    <Card 
                      key={prompt.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePromptClick(prompt.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{prompt.title}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {prompt.hub_area || "General"}
                          </Badge>
                        </div>
                        {prompt.description && (
                          <CardDescription className="line-clamp-2">
                            {prompt.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 overflow-hidden opacity-70 text-sm">
                          {prompt.prompt ? (
                            <div className="line-clamp-3 font-mono">
                              {prompt.prompt.substring(0, 150)}
                              {prompt.prompt.length > 150 ? "..." : ""}
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">
                              No preview available
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full gap-1.5"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromptClick(prompt.id);
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Customize & Generate</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PromptLibraryPage;
