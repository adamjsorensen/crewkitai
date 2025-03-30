
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SaveButtonProps {
  isSaving: boolean;
}

const SaveButton = ({ isSaving }: SaveButtonProps) => {
  return (
    <Button 
      type="submit" 
      className="w-full sm:w-auto min-h-[2.75rem] px-4 py-2 mt-4" 
      disabled={isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="truncate">Saving...</span>
        </>
      ) : (
        <span className="truncate">Save Settings</span>
      )}
    </Button>
  );
};

export default SaveButton;
