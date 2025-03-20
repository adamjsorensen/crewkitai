
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MessageSkeleton = () => {
  return (
    <div className="space-y-4 animate-fade-in my-6">
      {/* User message skeleton */}
      <div className="flex gap-3 items-start justify-end">
        <div className="rounded-2xl p-4 max-w-[85%] bg-primary/90 shadow-sm">
          <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
          <Skeleton className="h-4 w-48 mt-2 bg-primary-foreground/20" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      
      {/* Assistant message skeleton */}
      <div className="flex gap-3 items-start">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="rounded-2xl p-4 max-w-[85%] bg-muted shadow-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-72 mt-2" />
          <Skeleton className="h-4 w-56 mt-2" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
    </div>
  );
};

export default MessageSkeleton;
