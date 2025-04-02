import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import BackToAdminButton from "@/components/admin/BackToAdminButton";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  activeTab?: string;
}

const AdminLayout = ({ children, title, description, activeTab }: AdminLayoutProps) => {
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

  // If not admin (and not loading), we technically already navigated, but render null just in case.
  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-full">
        <BackToAdminButton />
        
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight truncate">{title}</h1>
            {description && <p className="text-sm md:text-base text-muted-foreground truncate">{description}</p>}
          </div>
        </div>
        
        <Separator className="my-0" />
        
        <div className="max-w-full">
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLayout;
