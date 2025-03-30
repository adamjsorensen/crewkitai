
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Settings, Database, BrainCircuit, ToggleLeft, Compass, ListFilter, FileText, Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

const AdminLayout = ({ children, activeTab = "ai-settings" }: AdminLayoutProps) => {
  const { isAdmin, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage application settings and configuration</p>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-4 md:p-6">
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="overflow-x-auto pb-2 hide-scrollbar">
              <TabsList className="mb-6 inline-flex w-auto min-w-max">
                {tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="flex items-center gap-1.5 whitespace-nowrap"
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className="max-w-[80px] md:max-w-none truncate">{tab.label}</span>
                  </TabsTrigger>
                ))}
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
