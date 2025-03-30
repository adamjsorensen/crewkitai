
import React from "react";
import { Loader2 } from "lucide-react";

const DialogLoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default DialogLoadingState;
