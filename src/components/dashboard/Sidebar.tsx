
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Menu,
  PaintBucket,
  LayoutDashboard,
  FileText,
  BarChart4,
  Settings,
  LogOut,
  User,
  Sparkles,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toggleSidebar, state } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Content", icon: FileText, path: "/dashboard/content" },
    { name: "Financial", icon: BarChart4, path: "/dashboard/financial" },
    { name: "AI Coach", icon: Sparkles, path: "/dashboard/ai-coach" },
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  // Admin menu items - only shown to admin users
  const adminItems = [
    { name: "Admin", icon: Shield, path: "/dashboard/admin/ai-settings" },
  ];

  // Renamed the function to SidebarContentItems to avoid conflict with the imported component
  const SidebarContentItems = () => (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-4">
          <PaintBucket className="h-6 w-6 text-primary" />
          <span className="font-display text-lg font-semibold">CrewkitAI</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
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
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4">
          <SidebarMenuButton 
            onClick={handleSignOut}
            tooltip="Sign Out"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </>
  );

  // On mobile, we use a Sheet component for the sidebar
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
              <SidebarContentItems />
            </SheetContent>
          </Sheet>
        </div>
        <div className="h-[60px]"></div> {/* Spacer for fixed header */}
      </>
    );
  }

  // On desktop, we use the sidebar component
  return (
    <>
      <Sidebar className="border-r">
        <SidebarContentItems />
        <SidebarRail />
      </Sidebar>
      
      {/* Collapsible sidebar toggle for desktop */}
      <div className="fixed bottom-4 left-4 z-50 md:flex hidden">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full shadow-md" 
          onClick={toggleSidebar}
        >
          {state === "collapsed" ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
};

export default DashboardSidebar;
