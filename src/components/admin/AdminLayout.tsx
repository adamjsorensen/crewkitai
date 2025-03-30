
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Settings, Database, BrainCircuit, ToggleLeft, Compass, ListFilter, FileText, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AdminLayout = ({ children, activeTab = "ai-settings" }: AdminLayoutProps) => {
  const { isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Redirect if not admin
  React.useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleTabChange = (value: string) => {
    navigate(`/dashboard/admin/${value}`);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 mx-auto w-full max-w-full md:max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage application settings and configuration</p>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-2 md:p-6 overflow-hidden">
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="mb-4 md:mb-6 w-full flex-nowrap justify-start">
                <TabsTrigger value="ai-settings" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <BrainCircuit className="h-3 w-3 md:h-4 md:w-4" />
                  <span>AI Settings</span>
                </TabsTrigger>
                <TabsTrigger value="compass-settings" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <Compass className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Compass</span>
                </TabsTrigger>
                <TabsTrigger value="content-settings" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Content</span>
                </TabsTrigger>
                <TabsTrigger value="prompts" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <FileText className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Prompts</span>
                </TabsTrigger>
                <TabsTrigger value="parameters" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <ListFilter className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Parameters</span>
                </TabsTrigger>
                <TabsTrigger value="feature-flags" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <ToggleLeft className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Features</span>
                </TabsTrigger>
                <TabsTrigger value="app-settings" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <Settings className="h-3 w-3 md:h-4 md:w-4" />
                  <span>App</span>
                </TabsTrigger>
                <TabsTrigger value="database" className="flex items-center gap-1.5 text-xs md:text-sm whitespace-nowrap">
                  <Database className="h-3 w-3 md:h-4 md:w-4" />
                  <span>DB</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              {children}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminLayout;
