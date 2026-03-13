import React from 'react';
import { Skeleton } from './Skeleton';

export function TableSkeleton({ rows = 5, className = '' }: { rows?: number, className?: string }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="card-header">
        <Skeleton height="20px" width="200px" className="mb-2" />
        <Skeleton height="12px" width="120px" />
      </div>
      <div className="p-0">
        <div className="flex px-6 py-4 border-b border-[var(--border-color)] gap-4">
           <Skeleton height="14px" width="100%" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex px-6 py-4 border-b border-[var(--border-color)] gap-4">
            <Skeleton height="16px" width="15%" />
            <Skeleton height="16px" width="35%" />
            <Skeleton height="16px" width="20%" />
            <Skeleton height="16px" width="15%" />
            <Skeleton height="16px" width="15%" />
          </div>
        ))}
      </div>
    </div>
  );
}
