
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaintBucket } from 'lucide-react';

const SkeletonLoader = () => {
  return (
    <div className="flex items-start gap-3 animate-fade-in my-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
        <PaintBucket className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl p-4 bg-muted/70 shadow-sm space-y-2 max-w-[85%]">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[75%]" />
        <div className="pt-1"></div>
        <Skeleton className="h-4 w-[80%]" />
        <Skeleton className="h-4 w-[85%]" />
      </div>
    </div>
  );
};

export default SkeletonLoader;
