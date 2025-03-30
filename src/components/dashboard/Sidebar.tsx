
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarProvider, Sidebar as UISidebar } from "@/components/ui/sidebar";
import { SidebarContentItems } from "./sidebar/SidebarContentItems";

const Sidebar = () => {
  return (
    <SidebarProvider defaultOpen={true}>
      <UISidebar className="fixed inset-y-0 left-0 z-10 w-[16rem] border-r">
        <SidebarContentItems />
      </UISidebar>
    </SidebarProvider>
  );
};

export default Sidebar;
