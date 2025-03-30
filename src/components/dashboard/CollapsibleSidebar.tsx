
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  BarChart3, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Shield,
  PaintBucket,
  Compass,
  Brush,
  Users,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const CollapsibleSidebar = () => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Helper to check if a menu item is active
  const isActive = (path: string) => {
    // Dashboard should only be active when exactly on /dashboard
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    
    // Special case for user management
    if (path.startsWith("/dashboard/user-management")) {
      return location.pathname.startsWith("/dashboard/user-management");
    }
    
    // For AI settings and other admin paths
    if (path === "/dashboard/admin/ai-settings") {
      return location.pathname.startsWith("/dashboard/admin/") && 
             !location.pathname.startsWith("/dashboard/admin/users");
    }
    
    // For other paths, check if the current path starts with the item path
    return location.pathname.startsWith(path);
  };

  // Updated nav items without User Management as a top-level item
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Strategic Compass", icon: Compass, path: "/dashboard/compass" },
    { name: "PainterGrowth AI", icon: Brush, path: "/dashboard/pg-coach" },
    { 
      name: "Content", 
      icon: FileText, 
      path: "/dashboard/content",
      badge: { text: "Coming Soon", variant: "secondary" as const } 
    },
    { 
      name: "Financial", 
      icon: BarChart3, 
      path: "/dashboard/financial",
      badge: { text: "Coming Soon", variant: "secondary" as const } 
    },
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  // Admin console section with User Management
  const adminItems = [
    { name: "Admin Console", icon: Shield, path: "/dashboard/admin/ai-settings" },
    { name: "User Management", icon: Users, path: "/dashboard/user-management/user-list" },
  ];

  // Sidebar content shared between desktop and mobile
  const SidebarContent = () => (
    <>
      {/* Main Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <div className="flex flex-1 items-center justify-between">
                <span className={cn(
                  "transition-opacity duration-200",
                  isCollapsed && !isMobile ? "opacity-0 w-0" : "opacity-100 w-auto"
                )}>
                  {item.name}
                </span>
                {item.badge && (!isCollapsed || isMobile) && (
                  <Badge 
                    variant={item.badge.variant} 
                    className="ml-2 text-xs h-5 px-1.5"
                  >
                    {item.badge.text}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <>
            <Separator className="my-4 mx-2" />
            <div className={cn(
              "px-4 text-xs font-semibold text-muted-foreground mb-2",
              isCollapsed && !isMobile ? "opacity-0" : "opacity-100"
            )}>
              Admin
            </div>
            <nav className="grid gap-1 px-2">
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn(
                    "transition-opacity duration-200",
                    isCollapsed && !isMobile ? "opacity-0 w-0" : "opacity-100 w-auto"
                  )}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* Footer with Sign Out */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          onClick={signOut}
          className="h-10 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground justify-start hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className={cn(
            "transition-opacity duration-200",
            isCollapsed && !isMobile ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            Sign Out
          </span>
        </Button>
      </div>
    </>
  );

  // Mobile version with hamburger menu
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 z-40 w-full bg-background/95 backdrop-blur-sm border-b flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <PaintBucket className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">CrewkitAI</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <div className="h-14 flex items-center border-b px-4">
                <div className="flex items-center gap-2 overflow-hidden">
                  <PaintBucket className="h-6 w-6 text-primary shrink-0" />
                  <span className="font-display text-lg font-semibold">
                    CrewkitAI
                  </span>
                </div>
              </div>
              <div className="flex flex-col h-[calc(100%-3.5rem)]">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-[60px]"></div> {/* Spacer for fixed header */}
      </>
    );
  }

  // Desktop version with collapsible sidebar
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-[4.5rem]" : "w-[16rem]"
    )}>
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <PaintBucket className="h-6 w-6 text-primary shrink-0" />
          <span className={cn(
            "font-display text-lg font-semibold transition-opacity duration-200",
            isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
          )}>
            CrewkitAI
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <SidebarContent />
    </aside>
  );
};

export default CollapsibleSidebar;
