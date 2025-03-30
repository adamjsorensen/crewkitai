
import React, { useState } from "react";
import { PaintBucket, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SidebarNavItems from "./SidebarNavItems";

const DesktopCollapsibleSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-background transition-all duration-300",
      isCollapsed ? "w-[4.5rem]" : "w-[16rem]"
    )}>
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <PaintBucket className="h-6 w-6 text-primary shrink-0" />
          <span className={cn(
            "font-display text-lg font-semibold transition-opacity duration-200",
            isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
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

      <SidebarNavItems isCollapsed={isCollapsed} />
    </aside>
  );
};

export default DesktopCollapsibleSidebar;
