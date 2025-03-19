
import React from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
