
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  BrainCircuit,
  Compass,
  ToggleLeft,
  Settings,
  Database,
  FileText,
  ListFilter,
  Sparkles,
  Users,
  Activity
} from "lucide-react";

interface AdminTileProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const AdminTile = ({ title, description, icon, path }: AdminTileProps) => {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="p-5 flex flex-col items-center text-center hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
      onClick={() => navigate(path)}
    >
      <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

const AdminDashboard = () => {
  const tiles = [
    {
      title: "AI Settings",
      description: "Configure AI coach behavior and responses",
      icon: <BrainCircuit className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/ai-settings"
    },
    {
      title: "Compass Settings",
      description: "Configure task management system",
      icon: <Compass className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/compass-settings"
    },
    {
      title: "Content Settings",
      description: "Configure content generation",
      icon: <Sparkles className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/content-settings"
    },
    {
      title: "Prompts",
      description: "Manage content generation prompts",
      icon: <FileText className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/prompts"
    },
    {
      title: "Parameters",
      description: "Manage prompt parameters",
      icon: <ListFilter className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/parameters"
    },
    {
      title: "Feature Flags",
      description: "Toggle application features",
      icon: <ToggleLeft className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/feature-flags"
    },
    {
      title: "User Management",
      description: "Manage users and activity",
      icon: <Users className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/users"
    },
    {
      title: "Activity Logs",
      description: "View user activity logs",
      icon: <Activity className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/activity-logs"
    },
    {
      title: "App Settings",
      description: "Configure general application settings",
      icon: <Settings className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/app-settings"
    },
    {
      title: "Database",
      description: "Database operations and monitoring",
      icon: <Database className="h-6 w-6 text-primary" />,
      path: "/dashboard/admin/database"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tiles.map((tile, index) => (
        <AdminTile key={index} {...tile} />
      ))}
    </div>
  );
};

export default AdminDashboard;
