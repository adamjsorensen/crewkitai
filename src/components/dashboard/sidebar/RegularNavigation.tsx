
import React from "react";
import SidebarNavLink from "./SidebarNavLink";
import SidebarAccordionItem from "./SidebarAccordionItem";
import { NavItemType } from "./types";
import { regularNavItems } from "./navItemsData";

interface RegularNavigationProps {
  isCollapsed?: boolean;
  accordionState: string[];
  toggleAccordion: (id: string) => void;
}

const RegularNavigation = ({ 
  isCollapsed = false, 
  accordionState, 
  toggleAccordion 
}: RegularNavigationProps) => {
  return (
    <nav className="grid gap-1 px-2">
      {regularNavItems.map((item) => (
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
    </nav>
  );
};

export default RegularNavigation;
