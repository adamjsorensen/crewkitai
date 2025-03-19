
import React, { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface FinancialLayoutProps {
  children: ReactNode;
  title?: string;
}

const FinancialLayout: React.FC<FinancialLayoutProps> = ({ 
  children, 
  title = "Financial Clarity"
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const tabs = [
    { value: "dashboard", label: "Dashboard", path: "/dashboard/financial" },
    { value: "jobs", label: "Job Analysis", path: "/dashboard/financial/jobs" },
    { value: "reports", label: "Reports", path: "/dashboard/financial/reports" },
    { value: "upload", label: "Upload Data", path: "/dashboard/financial/upload" },
  ];
  
  const activeTab = tabs.find(tab => tab.path === currentPath)?.value || "dashboard";

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your financial performance and make data-driven decisions
          </p>
        </div>
        
        <Tabs value={activeTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Link to={tab.path}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {children}
      </div>
    </DashboardLayout>
  );
};

export default FinancialLayout;
