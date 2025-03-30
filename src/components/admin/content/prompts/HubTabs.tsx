
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
  const hubs = [
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "operations", label: "Operations" },
    { value: "client_communications", label: "Client Communications" },
    { value: "general", label: "General" }
  ];

  return (
    <Tabs 
      defaultValue={activeHub} 
      onValueChange={(value) => setActiveHub(value as HubAreaType)}
    >
      <ScrollArea className="w-full" orientation="horizontal">
        <TabsList className="inline-flex w-auto min-w-max">
          {hubs.map(hub => (
            <TabsTrigger 
              key={hub.value} 
              value={hub.value} 
              className="whitespace-nowrap touch-callout-none min-h-[2.5rem]"
            >
              {hub.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ScrollArea>
      
      {hubs.map(hub => (
        <TabsContent key={hub.value} value={hub.value} className="mt-6 w-full max-w-full overflow-x-hidden">
          <PromptsManagement 
            hub={hub.value as HubAreaType} 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default HubTabs;
