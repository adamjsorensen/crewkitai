
import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccordionState } from "@/hooks/useAccordionState";
import { Badge } from "@/components/ui/badge";
import RegularNavigation from "./RegularNavigation";
import AdminNavigation from "./AdminNavigation";
import SignOutButton from "./SignOutButton";

interface SidebarNavItemsProps {
  isCollapsed?: boolean;
}

const SidebarNavItems = ({ isCollapsed = false }: SidebarNavItemsProps) => {
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();
  const isInAdminRoute = location.pathname.includes('/dashboard/admin');
  
  const [accordionState, setAccordionState] = useAccordionState(['admin-section']);

  const toggleAccordion = (id: string) => {
    setAccordionState(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  return (
    <>
      <div className="flex-1 overflow-auto py-2">
        <RegularNavigation 
          isCollapsed={isCollapsed} 
          accordionState={accordionState} 
          toggleAccordion={toggleAccordion} 
        />

        {isAdmin && (
          <AdminNavigation 
            isCollapsed={isCollapsed} 
            accordionState={accordionState} 
            toggleAccordion={toggleAccordion} 
          />
        )}
      </div>

      <SignOutButton isCollapsed={isCollapsed} onSignOut={signOut} />
    </>
  );
};

export default SidebarNavItems;
