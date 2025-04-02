
import React from "react";
import { cn } from "@/lib/utils";
import SidebarNavLink from "./SidebarNavLink";
import SidebarAccordionItem from "./SidebarAccordionItem";
import { NavItemType } from "./types";
import { adminNavItems } from "./navItemsData";

interface AdminNavigationProps {
  isCollapsed?: boolean;
  accordionState: string[];
  toggleAccordion: (id: string) => void;
}

const AdminNavigation = ({ 
  isCollapsed = false, 
  accordionState, 
  toggleAccordion 
}: AdminNavigationProps) => {
  return (
    <div className="mt-4 border-t pt-4 px-2">
      {/* Admin section header - simple label instead of accordion */}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
      </div>
      
      {/* Admin navigation items */}
      <div className="space-y-1 mt-1">
        {adminNavItems.map((item) => (
          'children' in item ? (
            <SidebarAccordionItem 
              key={item.name}
              item={item} 
              isCollapsed={isCollapsed} 
              accordionState={accordionState} 
              toggleAccordion={toggleAccordion} 
            />
          ) : (
            <SidebarNavLink key={item.path} item={item} isCollapsed={isCollapsed} />
          )
        ))}
      </div>
    </div>
  );
};

export default AdminNavigation;
