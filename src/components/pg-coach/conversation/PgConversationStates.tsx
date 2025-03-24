
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const PgConversationEmptyState: React.FC = () => {
  return (
    <div className="p-4 text-center text-muted-foreground">
      No conversations yet. Start a new chat!
    </div>
  );
};

export const PgConversationLoadingState: React.FC = () => {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex flex-col space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
};
