
import { 
  BarChart3 as RegularBarChart3,
  FileText as RegularFileText,
  Settings as GeneralSettingsIcon,
  LayoutDashboard,
  User as RegularUser,
  Shield,
  Compass,
  Brush,
  Users as AdminUsersIcon,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  Settings as AdminSettingsIcon,
  Bot,
  Flag,
  ClipboardList,
  Database as AdminDatabaseIcon,
  FileText as AdminFileText
} from "lucide-react";
import { NavItemType } from "./types";

// Regular user navigation items
export const regularNavItems: NavItemType[] = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { name: "Strategic Compass", icon: Compass, path: "/dashboard/compass" },
  { name: "PainterGrowth AI", icon: Brush, path: "/dashboard/pg-coach" },
  { name: "Content Creation", icon: RegularFileText, path: "/dashboard/content" },
  { name: "Financial Tools", icon: RegularBarChart3, path: "/dashboard/financial" },
  { name: "Profile", icon: RegularUser, path: "/dashboard/profile" },
  { name: "Settings", icon: GeneralSettingsIcon, path: "/dashboard/settings" },
];

// Admin navigation items
export const adminNavItems: NavItemType[] = [
  { name: "Admin Dashboard", icon: Shield, path: "/dashboard/admin", end: true },
  { name: "Users", icon: AdminUsersIcon, path: "/dashboard/admin/users" },
  {
    name: "Content & Prompts",
    icon: BookOpen,
    children: [
      { name: "Prompts", icon: Sparkles, path: "/dashboard/admin/prompts" },
      { name: "Parameters", icon: SlidersHorizontal, path: "/dashboard/admin/parameters" },
      { name: "Content Settings", icon: AdminSettingsIcon, path: "/dashboard/admin/content-settings" },
    ],
  },
  {
    name: "Settings",
    icon: AdminSettingsIcon,
    children: [
      { name: "AI Settings", icon: Bot, path: "/dashboard/admin/ai-settings" },
      { name: "App Settings", icon: AdminSettingsIcon, path: "/dashboard/admin/app-settings" },
      { name: "Compass Settings", icon: Compass, path: "/dashboard/admin/compass-settings" },
      { name: "Feature Flags", icon: Flag, path: "/dashboard/admin/feature-flags" },
    ],
  },
  {
    name: "Monitoring & Logs",
    icon: RegularBarChart3,
    children: [
      { name: "Generations Log", icon: AdminFileText, path: "/dashboard/admin/generations" },
      { name: "Activity Logs", icon: ClipboardList, path: "/dashboard/admin/activity-logs" },
      { name: "Database Info", icon: AdminDatabaseIcon, path: "/dashboard/admin/database" },
    ],
  },
];
