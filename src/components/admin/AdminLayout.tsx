
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const tabs = [
    { value: "ai-settings", icon: <BrainCircuit className="h-4 w-4" />, label: "AI Settings" },
    { value: "compass-settings", icon: <Compass className="h-4 w-4" />, label: "Compass Settings" },
    { value: "content-settings", icon: <Sparkles className="h-4 w-4" />, label: "Content Settings" },
    { value: "prompts", icon: <FileText className="h-4 w-4" />, label: "Prompts" },
    { value: "parameters", icon: <ListFilter className="h-4 w-4" />, label: "Parameters" },
    { value: "feature-flags", icon: <ToggleLeft className="h-4 w-4" />, label: "Feature Flags" },
    { value: "app-settings", icon: <Settings className="h-4 w-4" />, label: "App Settings" },
    { value: "database", icon: <Database className="h-4 w-4" />, label: "Database" },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 max-w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">Admin Console</h1>
            <p className="text-sm md:text-base text-muted-foreground truncate">Manage application settings and configuration</p>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-4 md:p-6 w-full overflow-hidden">
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <ScrollArea className="w-full mb-6" orientation="horizontal">
              <TabsList className="inline-flex w-auto min-w-max">
                {tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="flex items-center gap-1.5 whitespace-nowrap touch-callout-none min-h-[2.75rem]"
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className={isMobile ? "max-w-[60px] truncate" : ""}>
                      {tab.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            
            <TabsContent value={activeTab} className="mt-0 w-full max-w-full overflow-x-hidden">
              {children}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminLayout;
