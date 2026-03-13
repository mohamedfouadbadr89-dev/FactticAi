import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
}

export function Skeleton({ width, height, rounded = 'rounded-md', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
      }}
    />
  );
}
