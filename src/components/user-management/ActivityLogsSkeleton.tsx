
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

export const ActivityLogSkeleton = () => {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="whitespace-nowrap">
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-28" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24 rounded-full" />
      </TableCell>
      <TableCell className="max-w-sm">
        <Skeleton className="h-4 w-full max-w-[250px] mb-1" />
        <Skeleton className="h-3 w-3/4 max-w-[200px]" />
      </TableCell>
    </TableRow>
  );
};

export const ActivityLogListSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <ActivityLogSkeleton key={index} />
      ))}
    </>
  );
};
