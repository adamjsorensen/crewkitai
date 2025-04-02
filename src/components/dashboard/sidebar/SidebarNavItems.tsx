import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3 as RegularBarChart3,
  FileText as RegularFileText,
  Settings as GeneralSettingsIcon,
  LogOut,
  LayoutDashboard,
  User as RegularUser,
  Shield,
  Compass,
  Brush,
  Users as AdminUsersIcon,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  Settings as AdminSettingsIcon,
  Bot,
  Flag,
  ClipboardList,
  Database as AdminDatabaseIcon,
  FileText as AdminFileText
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Helper to check if a menu item or its children are active
const isNavItemActive = (path: string, location: { pathname: string }, isParent = false) => {
  if (isParent) {
    // For parent items (like /admin), check if the current path starts with it
    // but exclude the exact match if it's also a direct link (like /dashboard)
    return location.pathname.startsWith(path) && location.pathname !== path;
  }
  // For exact links
  return location.pathname === path;
};

interface NavLinkItem {
  name: string;
  icon: React.ElementType;
  path: string;
  end?: boolean;
  badge?: {
    text: string;
    variant: "secondary" | "default" | "destructive" | "outline";
  };
}

interface NavAccordionItem {
  name: string;
  icon: React.ElementType;
  children: NavLinkItem[];
}

type NavItemType = NavLinkItem | NavAccordionItem;

// Sidebar NavLink Component (minor change to use NavLink directly)
const SidebarNavLink = ({ item, isCollapsed }: { item: NavLinkItem, isCollapsed?: boolean }) => {
  const location = useLocation();
  
  return (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.end}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
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

interface SidebarNavItemsProps {
  isCollapsed?: boolean;
}

const SidebarNavItems = ({ isCollapsed = false }: SidebarNavItemsProps) => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();

  // Define Regular Navigation Items
  const regularNavItems: NavItemType[] = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
    { name: "Strategic Compass", icon: Compass, path: "/dashboard/compass" },
    { name: "PainterGrowth AI", icon: Brush, path: "/dashboard/pg-coach" },
    { name: "Profile", icon: RegularUser, path: "/dashboard/profile" },
    { name: "Settings", icon: GeneralSettingsIcon, path: "/dashboard/settings" },
  ];

  // Define Admin Navigation Items (using hierarchical structure)
  const adminNavItems: NavItemType[] = [
    { name: "Admin Dashboard", icon: Shield, path: "/dashboard/admin", end: true },
    { name: "Users", icon: AdminUsersIcon, path: "/dashboard/admin/users" },
    {
      name: "Content & Prompts",
      icon: BookOpen,
      children: [
        { name: "Prompts", icon: Sparkles, path: "/dashboard/admin/prompts" },
        { name: "Parameters", icon: SlidersHorizontal, path: "/dashboard/admin/parameters" },
        { name: "Content Settings", icon: AdminSettingsIcon, path: "/dashboard/admin/content-settings" },
      ],
    },
    {
      name: "Settings",
      icon: AdminSettingsIcon,
      children: [
        { name: "AI Settings", icon: Bot, path: "/dashboard/admin/ai-settings" },
        { name: "App Settings", icon: AdminSettingsIcon, path: "/dashboard/admin/app-settings" },
        { name: "Compass Settings", icon: Compass, path: "/dashboard/admin/compass-settings" },
        { name: "Feature Flags", icon: Flag, path: "/dashboard/admin/feature-flags" },
      ],
    },
    {
      name: "Monitoring & Logs",
      icon: RegularBarChart3,
      children: [
        { name: "Generations Log", icon: AdminFileText, path: "/dashboard/admin/generations" },
        { name: "Activity Logs", icon: ClipboardList, path: "/dashboard/admin/activity-logs" },
        { name: "Database Info", icon: AdminDatabaseIcon, path: "/dashboard/admin/database" },
      ],
    },
  ];

  // Helper to render nested items (Accordion or Link)
  const renderNavItem = (item: NavItemType, level = 0): JSX.Element => {
    if ('children' in item) {
      // Accordion Item
      const isChildActive = item.children.some(child => location.pathname.startsWith(child.path));
      return (
        <Accordion key={item.name} type="single" collapsible defaultValue={isChildActive ? item.name : undefined}>
          <AccordionItem value={item.name} className="border-b-0">
            <AccordionTrigger 
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground hover:no-underline",
                isChildActive ? "text-primary font-medium" : "text-muted-foreground",
                isCollapsed ? "justify-center" : "",
                level > 0 ? "font-normal" : "font-semibold" // Adjust font weight based on level
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn("transition-opacity duration-200 whitespace-nowrap overflow-hidden", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
                {item.name}
              </span>
            </AccordionTrigger>
            <AccordionContent className={cn("overflow-hidden space-y-1", isCollapsed ? "pl-0 ml-0 border-none" : "pl-5 ml-3 border-l")}>
              {/* Render children recursively */}
              {!isCollapsed && item.children.map(child => renderNavItem(child, level + 1))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    } else {
      // NavLink Item
      return <SidebarNavLink key={item.path} item={item} isCollapsed={isCollapsed} />;
    }
  };

  return (
    <>
      {/* Main Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {regularNavItems.map((item) => renderNavItem(item))}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <div className="mt-4 border-t pt-4 px-2"> {/* Add px-2 to match nav */} 
             {/* Render the top-level Admin Accordion */} 
             <Accordion type="single" collapsible className="w-full">
               <AccordionItem value="admin-section" className="border-b-0">
                 <AccordionTrigger 
                   className={cn(
                     "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground hover:no-underline",
                     location.pathname.startsWith('/dashboard/admin') ? "text-primary" : "text-muted-foreground",
                     isCollapsed ? "justify-center" : ""
                   )}
                 >
                   <Shield className="h-5 w-5 shrink-0" />
                   <span className={cn("transition-opacity duration-200 whitespace-nowrap overflow-hidden", isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto")}>
                     Admin
                   </span>
                 </AccordionTrigger>
                 <AccordionContent className={cn("overflow-hidden space-y-1", isCollapsed ? "pl-0 ml-0 border-none" : "pl-5 ml-3 border-l")}>
                   {/* Map over adminNavItems and call renderNavItem for each */}
                   {!isCollapsed && adminNavItems.map((item) => renderNavItem(item, 1))} {/* Start level at 1 */}
                 </AccordionContent>
               </AccordionItem>
             </Accordion>
          </div>
        )}
      </div>

      {/* Footer with Sign Out */}
      <div className="border-t p-4 mt-auto">
        <Button
          variant="ghost"
          onClick={signOut}
          className="h-10 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground justify-start hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className={cn(
            "transition-opacity duration-200",
            isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            Sign Out
          </span>
        </Button>
      </div>
    </>
  );
};

export default SidebarNavItems;
