
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Settings, Users, Database, BrainCircuit, ToggleLeft } from "lucide-react";
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground">Manage application settings and users</p>
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <Card className="p-6">
          <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="ai-settings" className="flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4" />
                <span>AI Settings</span>
              </TabsTrigger>
              <TabsTrigger value="feature-flags" className="flex items-center gap-1.5">
                <ToggleLeft className="h-4 w-4" />
                <span>Feature Flags</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="app-settings" className="flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                <span>App Settings</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                <span>Database</span>
              </TabsTrigger>
            </TabsList>
            
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
