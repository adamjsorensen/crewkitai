
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const BackToAdminButton = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate("/dashboard/admin");
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="mb-4 flex items-center gap-1" 
      onClick={handleClick}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>Back to Admin Dashboard</span>
    </Button>
  );
};

export default BackToAdminButton;
