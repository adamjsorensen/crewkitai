
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Shield,
  PaintBucket,
  Compass,
  Brush,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

export const SidebarContentItems = () => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();

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
    { name: "Content", icon: FileText, path: "/dashboard/content" },
    { name: "Financial", icon: BarChart3, path: "/dashboard/financial" },
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  // Admin console section with User Management
  const adminItems = [
    { name: "Admin Console", icon: Shield, path: "/dashboard/admin/ai-settings" },
    { name: "User Management", icon: Users, path: "/dashboard/user-management/user-list" },
  ];

  return (
    <>
      <SidebarHeader className="py-4 px-4 border-b">
        <div className="flex items-center gap-2">
          <PaintBucket className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold">CrewkitAI</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                    >
                      <Link to={item.path}>
                        <item.icon />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </>
  );
};
