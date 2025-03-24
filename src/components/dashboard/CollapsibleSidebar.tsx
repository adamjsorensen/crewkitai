
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  User, 
  Brush,
  MessageSquare,
  BrainCircuit,
  ClipboardList,
  Shield,
  PaintBucket,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const CollapsibleSidebar = () => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Content", icon: FileText, path: "/dashboard/content" },
    { name: "Financial", icon: BarChart3, path: "/dashboard/financial" },
    { name: "AI Coach", icon: Sparkles, path: "/dashboard/ai-coach" },
    { name: "PainterGrowth", icon: Brush, path: "/dashboard/pg-coach" },
    { name: "Strategic Planner", icon: ClipboardList, path: "/dashboard/compass" },
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  const adminItems = [
    { name: "AI Settings", icon: Shield, path: "/dashboard/admin/ai-settings" },
    { name: "Feature Flags", icon: Shield, path: "/dashboard/admin/feature-flags" },
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-[4.5rem]" : "w-[16rem]"
    )}>
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <PaintBucket className="h-6 w-6 text-primary" />
          <span className={cn(
            "font-display text-lg font-semibold transition-opacity",
            isCollapsed ? "opacity-0" : "opacity-100"
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
              <span className={cn(
                "transition-opacity",
                isCollapsed ? "opacity-0" : "opacity-100"
              )}>
                {item.name}
              </span>
            </Link>
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
                    "transition-opacity",
                    isCollapsed ? "opacity-0" : "opacity-100"
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
            "transition-opacity",
            isCollapsed ? "opacity-0" : "opacity-100"
          )}>
            Sign Out
          </span>
        </Button>
      </div>
    </aside>
  );
};

export default CollapsibleSidebar;
