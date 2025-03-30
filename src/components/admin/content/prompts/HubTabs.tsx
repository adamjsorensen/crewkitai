
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HubAreaType, Prompt } from "@/hooks/useCrewkitPrompts";
import PromptsManagement from "@/components/admin/content/PromptsManagement";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      <ScrollArea className="w-full pb-2">
        <TabsList className="flex flex-wrap sm:flex-nowrap gap-y-2">
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="client_communications">
            <span className="hidden md:inline">Client Communications</span>
            <span className="md:hidden">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </ScrollArea>
      
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
