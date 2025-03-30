
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SavedContentSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
};

export default SavedContentSkeleton;
