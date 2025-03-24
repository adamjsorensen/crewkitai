
import React from "react";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <CollapsibleSidebar />
      <div className="flex-1 flex flex-col ml-[4.5rem] transition-all duration-300">
        <main className="flex-1 p-4 bg-background overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
