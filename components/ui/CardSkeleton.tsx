import React from 'react';
import { Skeleton } from './Skeleton';

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card p-6 flex flex-col gap-4 ${className}`}>
      <div className="flex-1">
        <Skeleton height="24px" width="50%" className="mb-3" />
        <Skeleton height="12px" width="80%" className="mb-2" />
        <Skeleton height="12px" width="60%" />
      </div>
      <div className="mt-auto pt-6">
        <Skeleton height="40px" width="100%" rounded="rounded-lg" />
      </div>
    </div>
  );
}
