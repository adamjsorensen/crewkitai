
import React, { useEffect } from "react";
import {
  Sidebar,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { SidebarContentItems } from "./SidebarContentItems";

const DesktopSidebar = () => {
  const { state } = useSidebar();
  
  // Ensure sidebar is always visible in icon mode when collapsed
  useEffect(() => {
    if (state === "collapsed") {
      // Make sure the sidebar stays in icon-only mode and doesn't completely disappear
      const sidebarElement = document.querySelector('[data-collapsible="icon"]');
      if (sidebarElement) {
        sidebarElement.classList.remove('hidden');
        sidebarElement.classList.add('flex');
      }
    }
  }, [state]);

  return (
    <Sidebar className="border-r">
      <SidebarContentItems />
      <SidebarRail />
    </Sidebar>
  );
};

export default DesktopSidebar;
