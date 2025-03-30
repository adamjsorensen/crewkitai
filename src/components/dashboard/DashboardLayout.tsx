
import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSidebar from "./sidebar/MobileSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen h-screen w-full overflow-hidden">
      {isMobile ? (
        <>
          <MobileSidebar />
          <main className="flex-1 p-2 sm:p-4 bg-background overflow-y-auto h-full pt-[60px]">
            {children}
          </main>
        </>
      ) : (
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 p-4 bg-background overflow-y-auto h-full ml-[16rem]">
            {children}
          </main>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
