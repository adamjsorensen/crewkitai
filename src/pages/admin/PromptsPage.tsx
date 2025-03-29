
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCrewkitPrompts } from "@/hooks/useCrewkitPrompts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PromptsManagement from "@/components/admin/content/PromptsManagement";
import CreatePromptDialog from "@/components/admin/content/CreatePromptDialog";

const INITIAL_HUB = 'marketing';

type HubAreaType = 'marketing' | 'sales' | 'operations' | 'client_communications' | 'general';

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
    <AdminLayout activeTab="prompts">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Prompts Management</h2>
          <p className="text-muted-foreground">
            Manage prompt categories, base prompts, and their parameters
          </p>
        </div>
        
        <Separator className="my-6" />
        
        <Tabs defaultValue={INITIAL_HUB} onValueChange={(value) => setActiveHub(value as HubAreaType)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="client_communications">Client Communications</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>
            
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleCreatePrompt(null, true)}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Category</span>
              </Button>
              
              <Button 
                onClick={() => handleCreatePrompt(null, false)}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Prompt</span>
              </Button>
            </div>
          </div>
          
          <TabsContent value="marketing" className="mt-6">
            <PromptsManagement 
              hub="marketing" 
              prompts={hubPrompts} 
              isLoading={isLoading} 
              onCreatePrompt={handleCreatePrompt}
            />
          </TabsContent>
          
          <TabsContent value="sales" className="mt-6">
            <PromptsManagement 
              hub="sales" 
              prompts={hubPrompts} 
              isLoading={isLoading} 
              onCreatePrompt={handleCreatePrompt}
            />
          </TabsContent>
          
          <TabsContent value="operations" className="mt-6">
            <PromptsManagement 
              hub="operations" 
              prompts={hubPrompts} 
              isLoading={isLoading} 
              onCreatePrompt={handleCreatePrompt}
            />
          </TabsContent>
          
          <TabsContent value="client_communications" className="mt-6">
            <PromptsManagement 
              hub="client_communications" 
              prompts={hubPrompts} 
              isLoading={isLoading} 
              onCreatePrompt={handleCreatePrompt}
            />
          </TabsContent>
          
          <TabsContent value="general" className="mt-6">
            <PromptsManagement 
              hub="general" 
              prompts={hubPrompts} 
              isLoading={isLoading} 
              onCreatePrompt={handleCreatePrompt}
            />
          </TabsContent>
        </Tabs>
        
        <CreatePromptDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          parentId={parentId}
          isCategory={isCreatingCategory}
          hubArea={parentId ? undefined : activeHub}
        />
      </div>
    </AdminLayout>
  );
};

export default PromptsPage;
