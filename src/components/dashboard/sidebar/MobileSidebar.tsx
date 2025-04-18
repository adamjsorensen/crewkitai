
import React from "react";
import { Menu, PaintBucket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContentItems } from "./SidebarContentItems";

const MobileSidebar = () => {
  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b flex items-center p-3">
        {/* Hamburger Menu - Left Side */}
        <div className="flex-none">
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
        
        {/* Logo - Centered */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center gap-2">
            <PaintBucket className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">CrewkitAI</span>
          </div>
        </div>
        
        {/* Empty div for balance */}
        <div className="flex-none w-9 h-9"></div>
      </div>
      <div className="h-[60px]"></div> {/* Spacer for fixed header */}
    </>
  );
};

export default MobileSidebar;
