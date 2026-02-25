import React from 'react';
import { STATUS_COLORS, StatusLevel } from './riskColorMap';
import { TYPOGRAPHY_SCALE } from './typographyScale';

interface StatusBadgeProps {
  level: StatusLevel;
  className?: string;
}

/**
 * StatusBadge Component
 * 
 * Atomic indicator for system health and risk status.
 * Uses deterministic encoding from riskColorMap.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ level, className = '' }) => {
  const config = STATUS_COLORS[level];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: TYPOGRAPHY_SCALE.LABEL_SM.fontSize,
        fontWeight: TYPOGRAPHY_SCALE.LABEL_SM.fontWeight,
        textTransform: TYPOGRAPHY_SCALE.LABEL_SM.textTransform,
        letterSpacing: TYPOGRAPHY_SCALE.LABEL_SM.letterSpacing,
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
      className={className}
    >
      {level.replace('_', ' ')}
    </span>
  );
};
