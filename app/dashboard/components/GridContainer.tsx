import React from 'react';

/**
 * GridContainer (v1.0.0)
 * 12-column institutional grid system.
 * Constraints: No motion, max-width enforced, zero core logic dependencies.
 */
interface GridContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const GridContainer: React.FC<GridContainerProps> = ({ children, className = "" }) => {
  return (
    <div 
      className={`enterprise-grid-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(var(--grid-columns), 1fr)',
        gap: 'var(--grid-gutter)',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
};
