
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Users,
  Database,
  Flag,
  Wrench,
  Sparkles,
  SlidersHorizontal,
  BookOpen,
  Save,
  ListFilter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  title: string;
  exact?: boolean;
}

const SidebarItem = ({ href, icon: Icon, title, exact = false }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === href
    : location.pathname.startsWith(href);

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center py-2 px-3 text-sm font-medium rounded-md",
        "hover:bg-muted/80 transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-foreground/60 hover:text-foreground"
      )}
    >
      <Icon
        size={20}
        className={cn(
          "mr-2",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      {title}
    </Link>
  );
};

export const SidebarContentItems = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-1">
      <SidebarItem
        href="/dashboard"
        icon={LayoutDashboard}
        title="Dashboard"
        exact
      />
      <SidebarItem
        href="/dashboard/compass"
        icon={Compass}
        title="Business Compass"
      />
      <SidebarItem
        href="/dashboard/pg-coach"
        icon={MessageSquare}
        title="Painting Coach"
      />
      
      {/* Content Generation Links */}
      <SidebarItem 
        href="/dashboard/content" 
        icon={FileText} 
        title="Content Creation" 
      />
      <SidebarItem 
        href="/dashboard/saved-content" 
        icon={Save} 
        title="Saved Content" 
      />
      
      <SidebarItem
        href="/dashboard/financial"
        icon={BarChart3}
        title="Financial Tools"
      />

      {/* Admin Links */}
      {isAdmin && (
        <>
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
          </div>
          <SidebarItem
            href="/dashboard/user-management/user-list"
            icon={Users}
            title="User Management"
          />
          <SidebarItem
            href="/dashboard/admin/ai-settings"
            icon={Sparkles}
            title="AI Settings"
          />
          <SidebarItem
            href="/dashboard/admin/prompts"
            icon={BookOpen}
            title="Manage Prompts"
          />
          <SidebarItem
            href="/dashboard/admin/parameters"
            icon={SliderHorizontal}
            title="Manage Parameters"
          />
          <SidebarItem
            href="/dashboard/admin/generations"
            icon={ListFilter}
            title="Content Generations"
          />
          <SidebarItem
            href="/dashboard/admin/content-settings"
            icon={FileText}
            title="Content Settings"
          />
          <SidebarItem
            href="/dashboard/admin/compass-settings"
            icon={Compass}
            title="Compass Settings"
          />
          <SidebarItem
            href="/dashboard/admin/feature-flags"
            icon={Flag}
            title="Feature Flags"
          />
          <SidebarItem
            href="/dashboard/admin/app-settings"
            icon={Wrench}
            title="App Settings"
          />
          <SidebarItem
            href="/dashboard/admin/database"
            icon={Database}
            title="Database"
          />
        </>
      )}

      <div className="pt-4 pb-2">
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Profile
        </p>
      </div>
      <SidebarItem href="/dashboard/profile" icon={Users} title="My Profile" />
      <SidebarItem
        href="/dashboard/settings"
        icon={Settings}
        title="Settings"
      />
    </div>
  );
};
