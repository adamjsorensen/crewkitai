
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
  Compass
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
    { name: "Content", icon: FileText, path: "/dashboard/content" },
    { name: "Financial", icon: BarChart4, path: "/dashboard/financial" },
    // AI Coach hidden as requested
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  // Admin menu items - only shown to admin users
  const adminItems = [
    { name: "Admin", icon: Shield, path: "/dashboard/admin/ai-settings" },
    { name: "Compass Settings", icon: Compass, path: "/dashboard/admin/compass-settings" },
  ];

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
                  isActive={location.pathname === item.path}
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

        {isAdmin && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.path.split('/').slice(0, 3).join('/'))}
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
