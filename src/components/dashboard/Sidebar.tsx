
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PaintBucket, LayoutDashboard, FileText, BarChart4, Settings, LogOut, User, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="h-screen bg-sidebar border-r border-border flex flex-col">
      <div className="p-6 flex items-center gap-2 border-b border-border">
        <PaintBucket className="h-6 w-6 text-primary" />
        <span className="font-display text-lg font-semibold">CrewkitAI</span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium w-full text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-primary transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
