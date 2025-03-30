
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
      className="w-full sm:w-auto min-h-[2.75rem]" 
      disabled={isSaving}
    >
      {isSaving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Settings"
      )}
    </Button>
  );
};

export default SaveButton;
