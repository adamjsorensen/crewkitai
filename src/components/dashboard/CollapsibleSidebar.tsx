
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  BarChart3, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  LogOut, 
  Home, 
  User, 
  Briefcase, 
  Clock,
  MessageSquare,
  BrainCircuit,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

const CollapsibleSidebar = () => {
  const { signOut, profile, isAdmin } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div
      className={cn(
        "h-screen fixed left-0 top-0 z-40 bg-background border-r border-border flex flex-col transition-all duration-300",
        isCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      {/* Logo Area */}
      <div className="p-4 flex justify-between items-center h-16 border-b border-border">
        <Link to="/dashboard" className="flex items-center">
          <span className="font-bold text-xl">
            {isCollapsed ? "PG" : "PainterGrowth"}
          </span>
        </Link>
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

      {/* Navigation Links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <TooltipProvider>
          <ul className="space-y-1 px-2">
            <NavItem
              to="/dashboard"
              icon={<Home className="h-5 w-5" />}
              label="Dashboard"
              isActive={isActive("/dashboard") && location.pathname === "/dashboard"}
              isCollapsed={isCollapsed}
            />
            
            <NavItem
              to="/dashboard/ai-coach"
              icon={<BrainCircuit className="h-5 w-5" />}
              label="AI Coach"
              isActive={isActive("/dashboard/ai-coach")}
              isCollapsed={isCollapsed}
            />
            
            <NavItem
              to="/dashboard/pg-coach"
              icon={<MessageSquare className="h-5 w-5" />}
              label="PG Coach"
              isActive={isActive("/dashboard/pg-coach")}
              isCollapsed={isCollapsed}
            />
            
            <NavItem
              to="/dashboard/compass"
              icon={<ClipboardList className="h-5 w-5" />}
              label="Strategic Planner"
              isActive={isActive("/dashboard/compass")}
              isCollapsed={isCollapsed}
            />
            
            <NavItem
              to="/dashboard/financial"
              icon={<BarChart3 className="h-5 w-5" />}
              label="Financial"
              isActive={isActive("/dashboard/financial")}
              isCollapsed={isCollapsed}
            />
            
            <NavItem
              to="/dashboard/profile"
              icon={<User className="h-5 w-5" />}
              label="Profile"
              isActive={isActive("/dashboard/profile")}
              isCollapsed={isCollapsed}
            />
          </ul>
        </TooltipProvider>
      </nav>

      {/* User Profile & Settings */}
      <div className="p-4 border-t border-border">
        <TooltipProvider>
          <div className="space-y-1">
            {/* Admin Settings (conditional) */}
            {isAdmin && (
              <NavItem
                to="/dashboard/admin/ai-settings"
                icon={<Settings className="h-5 w-5" />}
                label="Admin Settings"
                isActive={isActive("/dashboard/admin")}
                isCollapsed={isCollapsed}
              />
            )}
            
            {/* Settings */}
            <NavItem
              to="/dashboard/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              isActive={isActive("/dashboard/settings")}
              isCollapsed={isCollapsed}
            />
            
            {/* Logout Button */}
            <div>
              {isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full justify-start"
                      onClick={signOut}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={signOut}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon, label, isActive, isCollapsed }: NavItemProps) => {
  return isCollapsed ? (
    <li>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link to={to}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="icon"
              className="w-full justify-start"
            >
              {icon}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </li>
  ) : (
    <li>
      <Link to={to}>
        <Button
          variant={isActive ? "default" : "ghost"}
          className="w-full justify-start"
        >
          {icon}
          <span className="ml-2">{label}</span>
        </Button>
      </Link>
    </li>
  );
};

export default CollapsibleSidebar;
