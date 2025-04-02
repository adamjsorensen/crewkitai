
import React, { useState, useEffect } from "react";
import CollapsibleSidebar from "./CollapsibleSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarCollapseState } from "@/hooks/useSidebarCollapseState";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapseState(false);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    if (isMobile) return; // Don't observe if on mobile
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const sidebar = document.querySelector('aside');
          if (sidebar) {
            const isCollapsed = sidebar.classList.contains('w-[4.5rem]');
            setSidebarCollapsed(isCollapsed);
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
  }, [isMobile, setSidebarCollapsed]);

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden">
      <CollapsibleSidebar />
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 h-full w-full max-w-full ${
          !isMobile ? (sidebarCollapsed ? "ml-[4.5rem]" : "ml-[16rem]") : ""
        }`}
      >
        <main className={`flex-1 p-4 bg-background overflow-y-auto overflow-x-hidden h-full w-full max-w-full ${isMobile ? 'pt-16' : ''}`}>
          <div className="w-full max-w-full mx-auto overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
