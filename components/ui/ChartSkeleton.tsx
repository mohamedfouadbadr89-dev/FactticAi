import React from 'react';
import { Skeleton } from './Skeleton';

export function ChartSkeleton({ className = '' }: { className?: string }) {
  // Use a pseudo-random fixed height array to avoid hydration mismatched while rendering on server/client.
  const heights = ['40%', '75%', '30%', '90%', '55%', '85%', '25%'];
  
  return (
    <div className={`card p-6 ${className}`}>
      <Skeleton height="20px" width="180px" className="mb-2" />
      <Skeleton height="12px" width="140px" className="mb-8" />
      <div className="flex items-end gap-2 h-40 mt-auto pt-4">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <Skeleton height={h} width="100%" rounded="rounded-t-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
