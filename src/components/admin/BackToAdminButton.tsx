
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const BackToAdminButton = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const handleClick = () => {
    navigate("/dashboard/admin");
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`flex items-center gap-1 hover:bg-primary/5 ${isMobile ? '' : 'mb-4'}`}
      onClick={handleClick}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Back to Admin Dashboard</span>
    </Button>
  );
};

export default BackToAdminButton;
