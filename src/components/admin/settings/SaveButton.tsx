
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SaveButtonProps {
  isSaving: boolean;
}

const SaveButton = ({ isSaving }: SaveButtonProps) => {
  return (
    <div className="flex justify-end mt-8">
      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <span>Save Settings</span>
        )}
      </Button>
    </div>
  );
};

export default SaveButton;
