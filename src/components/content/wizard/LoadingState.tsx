
import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Loading prompt...</span>
    </div>
  );
};

export default LoadingState;
