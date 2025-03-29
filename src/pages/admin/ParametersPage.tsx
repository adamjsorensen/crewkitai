
import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCrewkitPromptParameters } from "@/hooks/useCrewkitPromptParameters";
import ParametersTable from "@/components/admin/content/ParametersTable";
import TweaksTable from "@/components/admin/content/TweaksTable";
import CreateParameterDialog from "@/components/admin/content/CreateParameterDialog";
import CreateTweakDialog from "@/components/admin/content/CreateTweakDialog";

const ParametersPage = () => {
  const [activeTab, setActiveTab] = useState<string>("parameters");
  const [isCreateParameterOpen, setIsCreateParameterOpen] = useState(false);
  const [isCreateTweakOpen, setIsCreateTweakOpen] = useState(false);
  
  const { 
    parameters, 
    tweaks, 
    isLoading 
  } = useCrewkitPromptParameters();

  return (
    <AdminLayout activeTab="parameters">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Parameter Management</h2>
          <p className="text-muted-foreground">
            Create and manage parameters and their tweaks for prompt customization
          </p>
        </div>
        
        <Separator className="my-6" />
        
        <Tabs defaultValue="parameters" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="tweaks">Parameter Tweaks</TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={() => {
                if (activeTab === "parameters") {
                  setIsCreateParameterOpen(true);
                } else {
                  setIsCreateTweakOpen(true);
                }
              }}
              className="gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New {activeTab === "parameters" ? "Parameter" : "Tweak"}</span>
            </Button>
          </div>
          
          <TabsContent value="parameters" className="mt-6">
            <ParametersTable 
              parameters={parameters} 
              isLoading={isLoading} 
            />
          </TabsContent>
          
          <TabsContent value="tweaks" className="mt-6">
            <TweaksTable 
              tweaks={tweaks} 
              parameters={parameters}
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
        
        <CreateParameterDialog 
          open={isCreateParameterOpen} 
          onOpenChange={setIsCreateParameterOpen} 
        />
        
        <CreateTweakDialog 
          open={isCreateTweakOpen} 
          onOpenChange={setIsCreateTweakOpen}
          parameters={parameters}
        />
      </div>
    </AdminLayout>
  );
};

export default ParametersPage;
