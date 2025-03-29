
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, BookOpen, ChevronRight } from "lucide-react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryTile from "@/components/content/CategoryTile";
import PromptCard from "@/components/content/PromptCard";
import CustomPromptWizard from "@/components/content/CustomPromptWizard";

// Create a map of hub areas and their display names
const hubAreas = {
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  client_communications: "Client Communications",
  general: "General",
};

type HubAreaType = keyof typeof hubAreas;

const ContentPage = () => {
  const navigate = useNavigate();
  const { prompts, isLoading } = useCrewkitPrompts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<HubAreaType | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter prompts by search term and selected hub area
  const filteredPrompts = prompts
    .filter((prompt) => {
      // Filter by search term
      const matchesSearch =
        searchTerm === "" ||
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by hub area
      const matchesHubArea =
        currentTab === "all" ||
        (prompt.hub_area && prompt.hub_area === currentTab);

      // Filter by selected category
      const matchesCategory =
        !selectedCategory ||
        (prompt.parent_id === selectedCategory);

      return matchesSearch && matchesHubArea && (selectedCategory ? matchesCategory : true);
    });

  const rootCategories = filteredPrompts.filter(
    (prompt) => prompt.is_category && (!selectedCategory ? !prompt.parent_id : prompt.parent_id === selectedCategory)
  );
  
  const rootPrompts = filteredPrompts.filter(
    (prompt) => !prompt.is_category && (!selectedCategory ? !prompt.parent_id : prompt.parent_id === selectedCategory)
  );

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setWizardOpen(true);
  };

  const handleCategorySelect = (category: Prompt) => {
    setSelectedCategory(category.id);
  };

  const handleBackToRoot = () => {
    setSelectedCategory(null);
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
    setSelectedPrompt(null);
  };

  // Get the current category's title
  const currentCategory = selectedCategory
    ? prompts.find((p) => p.id === selectedCategory)
    : null;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Content Creation</h1>
              <p className="text-muted-foreground">
                Generate professional content for your painting business
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search prompts..."
              className="pl-10 w-full md:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as HubAreaType | "all")}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(hubAreas).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={currentTab} className="space-y-6">
            {selectedCategory && (
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToRoot}
                  className="mb-4"
                >
                  <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                  Back to {currentCategory ? currentCategory.parent_id ? "Category" : "Root" : "Root"}
                </Button>
                
                {currentCategory && (
                  <h2 className="text-xl font-bold mb-4">{currentCategory.title}</h2>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                {rootCategories.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Categories</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rootCategories.map((category) => (
                        <CategoryTile
                          key={category.id}
                          category={category}
                          onSelect={() => handleCategorySelect(category)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-xl font-semibold mb-4">Available Prompts</h2>
                {rootPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rootPrompts.map((prompt) => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onSelect={() => handlePromptSelect(prompt)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground mb-4">
                        No prompts found. Try adjusting your search or category selection.
                      </p>
                      {searchTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear Search
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedPrompt && (
        <CustomPromptWizard
          prompt={selectedPrompt}
          open={wizardOpen}
          onOpenChange={setWizardOpen}
        />
      )}
    </DashboardLayout>
  );
};

export default ContentPage;
