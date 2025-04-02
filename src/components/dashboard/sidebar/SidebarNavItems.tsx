import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Shield,
  Compass,
  Brush,
  Users
} from "lucide-react";

// Helper to check if a menu item is active
const isActive = (path: string, location: { pathname: string }) => {
  // Dashboard should only be active when exactly on /dashboard
  if (path === "/dashboard") {
    return location.pathname === "/dashboard";
  }
  
  // Special case for user management
  if (path.startsWith("/dashboard/user-management")) {
    return location.pathname.startsWith("/dashboard/user-management");
  }
  
  // For admin section 
  if (path === "/dashboard/admin") {
    return location.pathname.startsWith("/dashboard/admin");
  }
  
  // For other paths, check if the current path starts with the item path
  return location.pathname.startsWith(path);
};

interface NavItemProps {
  item: {
    name: string;
    icon: React.ElementType;
    path: string;
    badge?: {
      text: string;
      variant: "secondary" | "default" | "destructive" | "outline";
    };
  };
  isCollapsed?: boolean;
}

const NavItem = ({ item, isCollapsed }: NavItemProps) => {
  const location = useLocation();
  
  return (
    <Link
      key={item.path}
      to={item.path}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive(item.path, location)
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      <div className="flex flex-1 items-center justify-between">
        <span className={cn(
          "transition-opacity duration-200",
          isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
        )}>
          {item.name}
        </span>
        {item.badge && !isCollapsed && (
          <Badge 
            variant={item.badge.variant} 
            className="ml-2 text-xs h-5 px-1.5"
          >
            {item.badge.text}
          </Badge>
        )}
      </div>
    </Link>
  );
};

interface SidebarNavItemsProps {
  isCollapsed?: boolean;
}

const SidebarNavItems = ({ isCollapsed = false }: SidebarNavItemsProps) => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();

  // Main navigation items
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
    { name: "Admin Console", icon: Shield, path: "/dashboard/admin" },
    { name: "User Management", icon: Users, path: "/dashboard/user-management/user-list" },
  ];

  return (
    <>
      {/* Main Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* Admin section */}
        {isAdmin && (
          <>
            <Separator className="my-4 mx-2" />
            <div className={cn(
              "px-4 text-xs font-semibold text-muted-foreground mb-2",
              isCollapsed ? "opacity-0" : "opacity-100"
            )}>
              Admin
            </div>
            <nav className="grid gap-1 px-2">
              {adminItems.map((item) => (
                <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
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
