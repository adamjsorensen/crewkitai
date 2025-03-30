
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import DesktopCollapsibleSidebar from "./sidebar/DesktopCollapsibleSidebar";
import MobileTopBar from "./sidebar/MobileTopBar";

const CollapsibleSidebar = () => {
  const isMobile = useIsMobile();
  
  // Mobile version with hamburger menu
  if (isMobile) {
    return <MobileTopBar />;
  }

  // Desktop version with collapsible sidebar
  return <DesktopCollapsibleSidebar />;
};

export default CollapsibleSidebar;
