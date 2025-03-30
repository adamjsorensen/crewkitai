
import React, { useState, useEffect } from "react";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    if (isMobile) return; // Don't observe if on mobile
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const sidebar = document.querySelector('aside');
          if (sidebar) {
            setSidebarCollapsed(sidebar.classList.contains('w-[4.5rem]'));
          }
        }
      });
    });

    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
      // Initial state
      setSidebarCollapsed(sidebar.classList.contains('w-[4.5rem]'));
    }

    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden">
      <CollapsibleSidebar />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 h-full w-full max-w-full ${
          !isMobile ? (sidebarCollapsed ? "ml-[4.5rem]" : "ml-[16rem]") : ""
        }`}
      >
        <main className="flex-1 p-4 bg-background overflow-y-auto overflow-x-hidden h-full w-full max-w-full">
          <div className="w-full max-w-full mx-auto overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
