import React from 'react';

/**
 * StickyAlertZone (v1.0.0)
 * Primary surface for critical risk escalations.
 */
interface StickyAlertZoneProps {
  alerts?: string[];
}

export const StickyAlertZone: React.FC<StickyAlertZoneProps> = ({ alerts = [] }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="sticky-alert-zone" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '1rem 2rem',
      marginBottom: '2rem',
      gridColumn: 'span 12'
    }}>
      {alerts.map((alert, idx) => (
        <div key={idx} className="alert-item" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: 'var(--status-critical)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)'
        }}>
          <span className="status-pill critical">ESCALATION_ACTIVE</span>
          {alert}
        </div>
      ))}
    </div>
  );
};
