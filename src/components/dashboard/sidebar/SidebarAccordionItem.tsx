
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SidebarNavLink from "./SidebarNavLink";
import { NavAccordionItem } from "./types";

interface SidebarAccordionItemProps {
  item: NavAccordionItem;
  isCollapsed?: boolean;
  accordionState: string[];
  toggleAccordion: (id: string) => void;
  level?: number;
}

const SidebarAccordionItem = ({ 
  item, 
  isCollapsed = false, 
  accordionState, 
  toggleAccordion,
  level = 0 
}: SidebarAccordionItemProps) => {
  const location = useLocation();
  
  const isChildActive = item.children.some(child => 
    location.pathname === child.path || location.pathname.startsWith(child.path)
  );
  
  const accordionId = `accordion-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
  
  useEffect(() => {
    if (isChildActive && !accordionState.includes(accordionId)) {
      toggleAccordion(accordionId);
    }
  }, [isChildActive, accordionId, accordionState, toggleAccordion]);

  return (
    <Accordion 
      key={item.name} 
      type="multiple" 
      value={accordionState}
      onValueChange={(value) => {
        if (value.includes(accordionId) && !accordionState.includes(accordionId)) {
          toggleAccordion(accordionId);
        } else if (!value.includes(accordionId) && accordionState.includes(accordionId)) {
          toggleAccordion(accordionId);
        }
      }}
    >
      <AccordionItem value={accordionId} className="border-b-0">
        <AccordionTrigger 
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:no-underline",
            isChildActive ? "text-primary font-medium" : "text-muted-foreground",
            isCollapsed ? "justify-center" : "",
            level > 0 ? "font-normal" : "font-semibold"
          )}
        >
          <item.icon className={cn("h-5 w-5 shrink-0", isChildActive && "text-primary")} />
          <span className={cn("transition-opacity duration-200 whitespace-nowrap overflow-hidden", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
            {item.name}
          </span>
        </AccordionTrigger>
        <AccordionContent className={cn("overflow-hidden space-y-1", isCollapsed ? "pl-0 ml-0 border-none" : "pl-5 ml-3 border-l")}>
          {!isCollapsed && item.children.map(child => (
            <SidebarNavLink key={child.path} item={child} isCollapsed={isCollapsed} />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SidebarAccordionItem;
