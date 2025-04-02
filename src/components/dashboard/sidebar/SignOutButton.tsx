
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  isCollapsed?: boolean;
  onSignOut: () => void;
}

const SignOutButton = ({ isCollapsed = false, onSignOut }: SignOutButtonProps) => {
  return (
    <div className="border-t p-4 mt-auto">
      <Button
        variant="ghost"
        onClick={onSignOut}
        className="h-10 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground justify-start hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        <span className={cn(
          "transition-opacity duration-200",
          isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
        )}>
          Sign Out
        </span>
      </Button>
    </div>
  );
};

export default SignOutButton;
