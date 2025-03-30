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
    >
      <TabsList>
        <TabsTrigger value="marketing">Marketing</TabsTrigger>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
        <TabsTrigger value="client_communications">Client Communications</TabsTrigger>
        <TabsTrigger value="general">General</TabsTrigger>
      </TabsList>
      
      <TabsContent value="marketing" className="mt-6">
        <PromptsManagement 
          hub="marketing" 
          prompts={hubPrompts} 
          isLoading={isLoading} 
          onCreatePrompt={onCreatePrompt}
        />
      </TabsContent>
      
      <TabsContent value="sales" className="mt-6">
        <PromptsManagement 
          hub="sales" 
          prompts={hubPrompts} 
          isLoading={isLoading} 
          onCreatePrompt={onCreatePrompt}
        />
      </TabsContent>
      
      <TabsContent value="operations" className="mt-6">
        <PromptsManagement 
          hub="operations" 
          prompts={hubPrompts} 
          isLoading={isLoading} 
          onCreatePrompt={onCreatePrompt}
        />
      </TabsContent>
      
      <TabsContent value="client_communications" className="mt-6">
        <PromptsManagement 
          hub="client_communications" 
          prompts={hubPrompts} 
          isLoading={isLoading} 
          onCreatePrompt={onCreatePrompt}
        />
      </TabsContent>
      
      <TabsContent value="general" className="mt-6">
        <PromptsManagement 
          hub="general" 
          prompts={hubPrompts} 
          isLoading={isLoading} 
          onCreatePrompt={onCreatePrompt}
        />
      </TabsContent>
    </Tabs>
  );
};

export default HubTabs;
