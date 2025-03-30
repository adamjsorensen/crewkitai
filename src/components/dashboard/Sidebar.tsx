
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileSidebar from "./sidebar/MobileSidebar";
import DesktopSidebar from "./sidebar/DesktopSidebar";

const DashboardSidebar = () => {
  const isMobile = useIsMobile();
  
  // On mobile, we use a Sheet component for the sidebar
  if (isMobile) {
    return <MobileSidebar />;
  }

  // On desktop, we use the CollapsibleSidebar component
  return <DesktopSidebar />;
};

export default DashboardSidebar;
