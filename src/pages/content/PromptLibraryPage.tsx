
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, PlusCircle } from "lucide-react";
import { useCrewkitPrompts, Prompt } from "@/hooks/useCrewkitPrompts";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryTile from "@/components/content/CategoryTile";
import PromptCard from "@/components/content/PromptCard";
import CustomPromptWizard from "@/components/content/CustomPromptWizard";

const PromptLibraryPage = () => {
  const navigate = useNavigate();
  const { prompts, isLoading } = useCrewkitPrompts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Filter prompts by search term
  const filteredPrompts = searchTerm
    ? prompts.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : prompts;

  // Separate categories and regular prompts
  const categories = filteredPrompts.filter((prompt) => prompt.is_category);
  const regularPrompts = filteredPrompts.filter((prompt) => !prompt.is_category && !prompt.parent_id);

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setWizardOpen(true);
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
    setSelectedPrompt(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Prompt Library</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search prompts..."
                className="pl-10 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {categories.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <CategoryTile key={category.id} category={category} onClick={() => {}} />
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-4">Available Prompts</h2>
            {regularPrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularPrompts.map((prompt) => (
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
                  <p className="text-center text-muted-foreground mb-4">
                    No prompts found. Try adjusting your search or ask an admin to add some prompts.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {selectedPrompt && (
        <CustomPromptWizard
          promptId={selectedPrompt.id}
          isOpen={wizardOpen}
          onClose={handleWizardClose}
        />
      )}
    </DashboardLayout>
  );
};

export default PromptLibraryPage;
