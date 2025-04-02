
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { adminNavItems } from "@/components/dashboard/sidebar/navItemsData";
import { cn } from "@/lib/utils";
import { LayoutDashboard } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAccordionState } from "@/hooks/useAccordionState";

// Helper component for NavLink styling
const SidebarNavLink = ({ href, icon: Icon, label, isActive }: { href: string, icon: React.ElementType, label: string, isActive: boolean }) => {
  return (
    <NavLink
      to={href}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"}`
      }
    >
      <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
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
    adminNavItems.forEach(item => {
      if ('children' in item) {
        const shouldBeOpen = item.children.some(child => currentPath === child.path || currentPath.startsWith(child.path));
        const accordionId = item.name;
        
        if (shouldBeOpen && !accordionState.includes(accordionId)) {
          setAccordionState(prev => [...prev, accordionId]);
        }
      }
    });
  }, [location.pathname, accordionState, setAccordionState]);

  return (
    <nav className="hidden lg:flex flex-col h-full w-64 border-r bg-background p-4 flex-shrink-0 gap-2">
      <h2 className="text-lg font-semibold mb-4 px-3 text-primary">Admin Portal</h2>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {adminNavItems.map((item) => (
            'children' in item ? (
              <Accordion 
                key={item.name} 
                type="multiple" 
                value={accordionState}
                onValueChange={(value) => {
                  // Toggle the current item
                  if (value.includes(item.name) && !accordionState.includes(item.name)) {
                    setAccordionState([...accordionState, item.name]);
                  } else if (!value.includes(item.name) && accordionState.includes(item.name)) {
                    setAccordionState(accordionState.filter(id => id !== item.name));
                  }
                }}
              >
                <AccordionItem value={item.name} className="border-b-0">
                  <AccordionTrigger 
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180",
                      item.children.some(child => 
                        location.pathname === child.path || location.pathname.startsWith(child.path)
                      ) && "text-primary"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", 
                      item.children.some(child => 
                        location.pathname === child.path || location.pathname.startsWith(child.path)
                      ) && "text-primary"
                    )} />
                    <span>{item.name}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-4 space-y-1 border-l ml-5 pt-1">
                    {item.children.map((child) => (
                      <SidebarNavLink 
                        key={child.name} 
                        href={child.path} 
                        icon={child.icon} 
                        label={child.name} 
                        isActive={location.pathname === child.path || location.pathname.startsWith(child.path)}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <SidebarNavLink 
                key={item.name} 
                href={item.path} 
                icon={item.icon} 
                label={item.name} 
                isActive={location.pathname === item.path || location.pathname.startsWith(item.path)}
              />
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
    adminNavItems.forEach(item => {
      if ('children' in item) {
        const shouldBeOpen = item.children.some(child => currentPath === child.path || currentPath.startsWith(child.path));
        const accordionId = item.name;
        
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
            <h2 className="text-lg font-semibold mb-4 px-3 text-primary">Admin Portal</h2>
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-2">
                {adminNavItems.map((item) => (
                  'children' in item ? (
                    <Accordion 
                      key={item.name} 
                      type="multiple" 
                      value={accordionState}
                      onValueChange={(value) => {
                        // Toggle the current item
                        if (value.includes(item.name) && !accordionState.includes(item.name)) {
                          setAccordionState([...accordionState, item.name]);
                        } else if (!value.includes(item.name) && accordionState.includes(item.name)) {
                          setAccordionState(accordionState.filter(id => id !== item.name));
                        }
                      }}
                    >
                      <AccordionItem value={item.name} className="border-b-0">
                        <AccordionTrigger 
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180",
                            item.children.some(child => 
                              location.pathname === child.path || location.pathname.startsWith(child.path)
                            ) && "text-primary"
                          )}
                        >
                          <item.icon className={cn("h-5 w-5", 
                            item.children.some(child => 
                              location.pathname === child.path || location.pathname.startsWith(child.path)
                            ) && "text-primary"
                          )} />
                          <span>{item.name}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pl-4 space-y-1 border-l ml-5 pt-1">
                          {item.children.map((child) => (
                            <SidebarNavLink 
                              key={child.name} 
                              href={child.path} 
                              icon={child.icon} 
                              label={child.name}
                              isActive={location.pathname === child.path || location.pathname.startsWith(child.path)}
                            />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <SidebarNavLink 
                      key={item.name} 
                      href={item.path} 
                      icon={item.icon} 
                      label={item.name}
                      isActive={location.pathname === item.path || location.pathname.startsWith(child.path)}
                    />
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
