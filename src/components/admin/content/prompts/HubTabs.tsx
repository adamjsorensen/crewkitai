
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HubAreaType, Prompt } from "@/hooks/useCrewkitPrompts";
import PromptsManagement from "@/components/admin/content/PromptsManagement";

interface HubTabsProps {
  activeHub: HubAreaType;
  setActiveHub: (hub: HubAreaType) => void;
  hubPrompts: Prompt[];
  isLoading: boolean;
  onCreatePrompt: (parentId: string | null, isCategory: boolean) => void;
}

const HubTabs: React.FC<HubTabsProps> = ({
  activeHub,
  setActiveHub,
  hubPrompts,
  isLoading,
  onCreatePrompt
}) => {
  return (
    <Tabs 
      defaultValue={activeHub} 
      onValueChange={(value) => setActiveHub(value as HubAreaType)}
      className="w-full"
    >
      <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start mb-4 p-1">
        <TabsTrigger value="marketing" className="flex-shrink-0">Marketing</TabsTrigger>
        <TabsTrigger value="sales" className="flex-shrink-0">Sales</TabsTrigger>
        <TabsTrigger value="operations" className="flex-shrink-0">Operations</TabsTrigger>
        <TabsTrigger value="client_communications" className="flex-shrink-0">
          <span className="hidden sm:inline">Client Communications</span>
          <span className="sm:hidden">Client</span>
        </TabsTrigger>
        <TabsTrigger value="general" className="flex-shrink-0">General</TabsTrigger>
      </TabsList>
      
      <div className="w-full overflow-hidden">
        <TabsContent value="marketing" className="mt-6 w-full">
          <PromptsManagement 
            hub="marketing" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="sales" className="mt-6 w-full">
          <PromptsManagement 
            hub="sales" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="operations" className="mt-6 w-full">
          <PromptsManagement 
            hub="operations" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="client_communications" className="mt-6 w-full">
          <PromptsManagement 
            hub="client_communications" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="general" className="mt-6 w-full">
          <PromptsManagement 
            hub="general" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default HubTabs;
