
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HubAreaType, Prompt } from "@/hooks/useCrewkitPrompts";
import PromptsManagement from "@/components/admin/content/PromptsManagement";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // Shorter labels for mobile
  const getTabLabel = (full: string, short: string) => {
    return isMobile ? short : full;
  };

  return (
    <Tabs 
      defaultValue={activeHub} 
      onValueChange={(value) => setActiveHub(value as HubAreaType)}
      className="w-full"
    >
      <div className="overflow-x-auto pb-1 -mx-2 px-2">
        <TabsList className="w-full flex-nowrap justify-start mb-2 md:mb-4 p-1">
          <TabsTrigger value="marketing" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">
            {getTabLabel("Marketing", "Mktg")}
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">
            Sales
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">
            {getTabLabel("Operations", "Ops")}
          </TabsTrigger>
          <TabsTrigger value="client_communications" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">
            {getTabLabel("Client Communications", "Client")}
          </TabsTrigger>
          <TabsTrigger value="general" className="flex-shrink-0 text-xs md:text-sm px-2 md:px-3">
            {getTabLabel("General", "Gen")}
          </TabsTrigger>
        </TabsList>
      </div>
      
      <div className="w-full overflow-hidden">
        <TabsContent value="marketing" className="mt-2 md:mt-6 w-full">
          <PromptsManagement 
            hub="marketing" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="sales" className="mt-2 md:mt-6 w-full">
          <PromptsManagement 
            hub="sales" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="operations" className="mt-2 md:mt-6 w-full">
          <PromptsManagement 
            hub="operations" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="client_communications" className="mt-2 md:mt-6 w-full">
          <PromptsManagement 
            hub="client_communications" 
            prompts={hubPrompts} 
            isLoading={isLoading} 
            onCreatePrompt={onCreatePrompt}
          />
        </TabsContent>
        
        <TabsContent value="general" className="mt-2 md:mt-6 w-full">
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
