import React, { useState, useEffect } from "react";
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
  ChevronRight,
  Brush
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

const CollapsibleSidebar = () => {
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Content", icon: FileText, path: "/dashboard/content" },
    { name: "Financial", icon: BarChart4, path: "/dashboard/financial" },
    { name: "AI Coach", icon: Sparkles, path: "/dashboard/ai-coach" },
    { name: "PainterGrowth", icon: Brush, path: "/dashboard/pg-coach" },
    { name: "Profile", icon: User, path: "/dashboard/profile" },
    { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 z-40 w-full bg-background/95 backdrop-blur-sm border-b flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <PaintBucket className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-semibold">CrewkitAI</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PaintBucket className="h-5 w-5 text-primary" />
                  <span className="font-display text-lg font-semibold">CrewkitAI</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-2 pt-4">
                <nav className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
                
                {isAdmin && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-xs font-semibold text-muted-foreground px-3 mb-2">Admin</div>
                    <nav className="space-y-2">
                      {adminItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                            location.pathname.startsWith(item.path.split('/').slice(0, 3).join('/'))
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      ))}
                    </nav>
                  </>
                )}
              </div>
              
              <div className="p-4 border-t">
                <Button 
                  variant="ghost" 
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-[4.5rem]" : "w-[16rem]"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <PaintBucket className="h-6 w-6 text-primary" />
            <span className={cn("font-display text-lg font-semibold transition-opacity", 
              collapsed ? "opacity-0 w-0" : "opacity-100"
            )}>
              CrewkitAI
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      location.pathname === item.path
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className={cn("transition-opacity", 
                      collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {isAdmin && (
            <>
              <Separator className="my-4 mx-2" />
              <div className={cn(
                "px-4 text-xs font-semibold text-muted-foreground mb-2",
                collapsed ? "opacity-0" : "opacity-100"
              )}>
                Admin
              </div>
              <nav className="grid gap-1 px-2">
                {adminItems.map((item) => (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          location.pathname.startsWith(item.path.split('/').slice(0, 3).join('/'))
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className={cn("transition-opacity", 
                          collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                        )}>
                          {item.name}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </nav>
            </>
          )}
        </div>

        <div className="border-t p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground justify-start hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span className={cn("transition-opacity", 
                  collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                )}>
                  Sign Out
                </span>
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                Sign Out
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default CollapsibleSidebar;
