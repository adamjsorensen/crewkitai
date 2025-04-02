
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard, 
  Users, 
  Settings, 
  Bot, 
  FileText, 
  Database, 
  BookOpen, 
  Sparkles, 
  ClipboardList, 
  Flag, 
  SlidersHorizontal, 
  BarChart3
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAccordionState } from "@/hooks/useAccordionState";
import { cn } from "@/lib/utils";

// Define navigation items
const navItems = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  {
    label: "Content & Prompts",
    icon: BookOpen,
    children: [
      { label: "Prompts", href: "/dashboard/admin/prompts", icon: Sparkles },
      { label: "Parameters", href: "/dashboard/admin/parameters", icon: SlidersHorizontal },
      { label: "Content Settings", href: "/dashboard/admin/content-settings", icon: Settings },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "AI Settings", href: "/dashboard/admin/ai-settings", icon: Bot },
      { label: "App Settings", href: "/dashboard/admin/app-settings", icon: Settings },
      { label: "Compass Settings", href: "/dashboard/admin/compass-settings", icon: Settings },
      { label: "Feature Flags", href: "/dashboard/admin/feature-flags", icon: Flag },
    ],
  },
  {
    label: "Monitoring & Logs",
    icon: BarChart3,
    children: [
      { label: "Generations Log", href: "/dashboard/admin/generations", icon: FileText },
      { label: "Activity Logs", href: "/dashboard/admin/activity-logs", icon: ClipboardList },
      { label: "Database Info", href: "/dashboard/admin/database", icon: Database },
    ],
  },
];

// Helper component for NavLink styling
const SidebarNavLink = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === href || location.pathname.startsWith(href);
  
  return (
    <NavLink
      to={href}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted hover:text-primary ${isActive ? "bg-muted text-primary font-semibold" : "text-muted-foreground"}`
      }
    >
      <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
      {label}
    </NavLink>
  );
};

// Desktop Sidebar Component
const AdminDesktopSidebar = () => {
  const location = useLocation();
  const [accordionState, setAccordionState] = useAccordionState([], "admin-sidebar-state");
  
  // Check which section should be auto-opened based on current path
  React.useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach(item => {
      if ('children' in item) {
        const shouldBeOpen = item.children.some(child => currentPath === child.href || currentPath.startsWith(child.href));
        const accordionId = item.label;
        
        if (shouldBeOpen && !accordionState.includes(accordionId)) {
          setAccordionState(prev => [...prev, accordionId]);
        }
      }
    });
  }, [location.pathname, accordionState, setAccordionState]);

  return (
    <nav className="hidden lg:flex flex-col h-full w-64 border-r bg-background p-4 flex-shrink-0 gap-2">
      <h2 className="text-lg font-semibold mb-2 px-3">Admin Menu</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-2">
          {navItems.map((item) => (
            item.children ? (
              <Accordion 
                key={item.label} 
                type="multiple" 
                value={accordionState}
                onValueChange={(value) => {
                  // Toggle the current item
                  if (value.includes(item.label) && !accordionState.includes(item.label)) {
                    setAccordionState([...accordionState, item.label]);
                  } else if (!value.includes(item.label) && accordionState.includes(item.label)) {
                    setAccordionState(accordionState.filter(id => id !== item.label));
                  }
                }}
              >
                <AccordionItem value={item.label} className="border-b-0">
                  <AccordionTrigger 
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-primary hover:no-underline [&[data-state=open]>svg]:rotate-180",
                      item.children.some(child => 
                        location.pathname === child.href || location.pathname.startsWith(child.href)
                      ) && "text-primary font-medium"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", 
                      item.children.some(child => 
                        location.pathname === child.href || location.pathname.startsWith(child.href)
                      ) && "text-primary"
                    )} />
                    <span>{item.label}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-1 border-l ml-5">
                    {item.children.map((child) => (
                      <SidebarNavLink key={child.label} href={child.href!} icon={child.icon} label={child.label} />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <SidebarNavLink key={item.label} href={item.href!} icon={item.icon} label={item.label} />
            )
          ))}
        </div>
      </ScrollArea>
    </nav>
  );
};

// Mobile Top Bar / Sheet Trigger Component
const AdminMobileTopBar = () => {
  const location = useLocation();
  const [accordionState, setAccordionState] = useAccordionState([], "admin-sidebar-mobile-state");
  
  // Check which section should be auto-opened based on current path
  React.useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach(item => {
      if ('children' in item) {
        const shouldBeOpen = item.children.some(child => currentPath === child.href || currentPath.startsWith(child.href));
        const accordionId = item.label;
        
        if (shouldBeOpen && !accordionState.includes(accordionId)) {
          setAccordionState(prev => [...prev, accordionId]);
        }
      }
    });
  }, [location.pathname, accordionState, setAccordionState]);
  
  return (
    <div className="lg:hidden border-b bg-background p-2 sticky top-0 z-40">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-64">
          <nav className="flex flex-col h-full bg-background p-4 gap-2">
            <h2 className="text-lg font-semibold mb-2 px-3">Admin Menu</h2>
            <ScrollArea className="flex-1">
              <div className="space-y-1 pr-2">
                {navItems.map((item) => (
                  item.children ? (
                    <Accordion 
                      key={item.label} 
                      type="multiple" 
                      value={accordionState}
                      onValueChange={(value) => {
                        // Toggle the current item
                        if (value.includes(item.label) && !accordionState.includes(item.label)) {
                          setAccordionState([...accordionState, item.label]);
                        } else if (!value.includes(item.label) && accordionState.includes(item.label)) {
                          setAccordionState(accordionState.filter(id => id !== item.label));
                        }
                      }}
                    >
                      <AccordionItem value={item.label} className="border-b-0">
                        <AccordionTrigger 
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-primary hover:no-underline [&[data-state=open]>svg]:rotate-180",
                            item.children.some(child => 
                              location.pathname === child.href || location.pathname.startsWith(child.href)
                            ) && "text-primary font-medium"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", 
                            item.children.some(child => 
                              location.pathname === child.href || location.pathname.startsWith(child.href)
                            ) && "text-primary"
                          )} />
                          <span>{item.label}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pl-4 space-y-1 border-l ml-5">
                          {item.children.map((child) => (
                            <SidebarNavLink key={child.label} href={child.href!} icon={child.icon} label={child.label} />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <SidebarNavLink key={item.label} href={item.href!} icon={item.icon} label={item.label} />
                  )
                ))}
              </div>
            </ScrollArea>
          </nav>
        </SheetContent>
      </Sheet>
      <span className="ml-2 font-semibold text-sm">Admin Area</span>
    </div>
  );
};

const AdminSidebar = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <AdminMobileTopBar />;
  }

  return <AdminDesktopSidebar />;
};

export default AdminSidebar; 
