
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  PaintBucket,
  LayoutDashboard,
  FileText,
  BarChart4,
  Settings,
  LogOut,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Compass,
  Brush,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SidebarContentItems = () => {
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

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
      icon: BarChart4, 
      path: "/dashboard/financial", 
      badge: { text: "Coming Soon", variant: "secondary" as const } 
    },
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const adminItems = [
    { name: "Admin Console", icon: Shield, path: "/dashboard/admin/ai-settings" },
  ];

  // Add User Management as its own top-level item for admins
  if (isAdmin) {
    navItems.push({ 
      name: "User Management", 
      icon: Users, 
      path: "/dashboard/user-management/user-list" 
    });
  }

  const isItemActive = (itemPath: string) => {
    if (itemPath === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    // Special case for user management
    if (itemPath.startsWith("/dashboard/user-management")) {
      return location.pathname.startsWith("/dashboard/user-management");
    }
    // Special case for admin console
    if (itemPath === "/dashboard/admin/ai-settings") {
      return location.pathname.startsWith("/dashboard/admin/") && 
             !location.pathname.startsWith("/dashboard/admin/users");
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <>
      <SidebarHeader className="py-3">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <PaintBucket className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-semibold">CrewkitAI</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 ml-2 hover:bg-accent" 
            onClick={toggleSidebar}
          >
            {state === "collapsed" ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(item.path)}
                  tooltip={item.name}
                >
                  <Link to={item.path} className="flex justify-between w-full">
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant={item.badge.variant} 
                        className="ml-2 text-xs h-5 px-1.5"
                      >
                        {item.badge.text}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive(item.path)}
                      tooltip={item.name}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarSeparator className="my-2" />

      <SidebarFooter className="py-3 px-2">
        <SidebarMenuButton 
          onClick={handleSignOut}
          tooltip="Sign Out"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </>
  );
};

export default SidebarContentItems;
