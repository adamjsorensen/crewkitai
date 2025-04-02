
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { NavLinkItem } from "./types";

interface SidebarNavLinkProps {
  item: NavLinkItem;
  isCollapsed?: boolean;
}

const SidebarNavLink = ({ item, isCollapsed = false }: SidebarNavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === item.path || 
                  (!item.end && location.pathname.startsWith(item.path));
  
  return (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.end}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
      <span className={cn(
        "transition-opacity duration-200 whitespace-nowrap overflow-hidden",
        isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
      )}>
        {item.name}
      </span>
      {item.badge && !isCollapsed && (
        <Badge 
          variant={item.badge.variant} 
          className="ml-auto text-xs h-5 px-1.5 shrink-0"
        >
          {item.badge.text}
        </Badge>
      )}
    </NavLink>
  );
};

export default SidebarNavLink;
