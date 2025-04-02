
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCrewkitPrompts, HubAreaType } from "@/hooks/useCrewkitPrompts";
import CreatePromptDialog from "@/components/admin/content/CreatePromptDialog";
import PageHeader from "@/components/admin/content/prompts/PageHeader";
import ActionButtons from "@/components/admin/content/prompts/ActionButtons";
import HubTabs from "@/components/admin/content/prompts/HubTabs";

const INITIAL_HUB = 'marketing';

const PromptsPage = () => {
  const [activeHub, setActiveHub] = useState<HubAreaType>(INITIAL_HUB);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  // Root-level prompts and categories for the current hub
  const { prompts: rootPrompts, isLoading } = useCrewkitPrompts(null);
  
  // Filter by hub area
  const hubPrompts = rootPrompts.filter(
    prompt => prompt.hub_area === activeHub || (prompt.is_category && !prompt.hub_area)
  );
  
  const handleCreatePrompt = (parentId: string | null = null, isCategory: boolean = false) => {
    setParentId(parentId);
    setIsCreatingCategory(isCategory);
    setIsCreateDialogOpen(true);
  };

  return (
    <AdminLayout 
      title="Prompts Management"
      description="Manage prompt categories, base prompts, and their parameters"
      activeTab="prompts"
    >
      <PageHeader 
        title="Prompts Management" 
        description="Manage prompt categories, base prompts, and their parameters"
      />
      
      <div className="flex items-center justify-between mb-6">
        <ActionButtons 
          onCreateCategory={() => handleCreatePrompt(null, true)}
          onCreatePrompt={() => handleCreatePrompt(null, false)}
        />
      </div>
      
      <HubTabs 
        activeHub={activeHub}
        setActiveHub={setActiveHub}
        hubPrompts={hubPrompts}
        isLoading={isLoading}
        onCreatePrompt={handleCreatePrompt}
      />
      
      <CreatePromptDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        parentId={parentId}
        isCategory={isCreatingCategory}
        hubArea={parentId ? undefined : activeHub}
      />
    </AdminLayout>
  );
};

export default PromptsPage;
