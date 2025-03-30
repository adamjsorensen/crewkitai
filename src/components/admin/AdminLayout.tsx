
import React from "react";
import { Outlet } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminNav from "./AdminNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
}

const AdminLayout = ({ children, activeTab }: AdminLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      
      <div className="flex flex-col sm:flex-row flex-1">
        <AdminNav activeTab={activeTab} className={isMobile ? "px-2 py-2" : "px-4 py-4"} />
        
        <div className="flex-1 p-2 sm:p-4 overflow-hidden">
          <main className="w-full max-w-full overflow-x-hidden">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
