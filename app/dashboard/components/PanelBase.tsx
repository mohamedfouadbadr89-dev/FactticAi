import React from 'react';
import { motion } from 'framer-motion';

/**
 * PanelBase (v1.1.0)
 * Objective: Standardized structural card for Enterprise Grid.
 * Zones: Title | Status | Data | Footer
 * Interaction: Deterministic hover elevation.
 */
import { TYPOGRAPHY_SCALE } from './typographyScale';

interface PanelBaseProps {
  title: string;
  span?: 3 | 4 | 6 | 12;
  children: React.ReactNode;
  actions?: React.ReactNode;
  statusNode?: React.ReactNode;
  footer?: React.ReactNode;
  density?: 'executive' | 'command';
  onInspect?: () => void;
}

export const PanelBase: React.FC<PanelBaseProps> = ({ 
  title, 
  span = 4, 
  children, 
  actions,
  statusNode,
  footer,
  density = 'executive',
  onInspect
}) => {
  const isExecutive = density === 'executive';
  
  const theme = {
    bg: isExecutive ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
    border: isExecutive ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
    text: isExecutive ? '#0f172a' : 'rgba(255, 255, 255, 0.9)',
    headerBg: isExecutive ? '#f8fafc' : 'rgba(255, 255, 255, 0.01)',
    headerBorder: isExecutive ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
    padding: isExecutive ? '2rem' : '0.75rem',
    headerPadding: isExecutive ? '1.25rem 2rem' : '0.5rem 0.75rem'
  };

  const motionProps = {
    whileHover: { 
      y: -4,
      boxShadow: isExecutive 
        ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' 
        : '0 4px 6px -1px rgba(255, 255, 255, 0.02)'
    },
    transition: { 
      duration: isExecutive ? 0.24 : 0.16, 
      ease: isExecutive ? 'easeInOut' : [0, 0.55, 0.45, 1] as any // circOut approximation
    }
  };

  return (
    <motion.div 
      {...motionProps}
      style={{
        gridColumn: `span ${span}`,
        backgroundColor: theme.bg,
        border: theme.border,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isExecutive ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none',
        willChange: 'transform, box-shadow'
      }}
    >
      <div style={{
        padding: theme.headerPadding,
        borderBottom: theme.headerBorder,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: theme.headerBg
      }}>
        <h3 style={{ 
          margin: 0, 
          ...TYPOGRAPHY_SCALE.HEADING_MD,
          color: theme.text 
        }}>
          {title}
        </h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(actions || statusNode) && <div>{actions || statusNode}</div>}
          {onInspect && (
            <button 
              onClick={onInspect}
              style={{
                background: 'none',
                border: isExecutive ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                color: 'inherit',
                borderRadius: '4px',
                padding: '2px 6px',
                ...TYPOGRAPHY_SCALE.LABEL_SM,
                cursor: 'pointer',
                opacity: 0.6,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              <span>INSPECT</span>
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, padding: theme.padding, color: theme.text }}>
        {children}
      </div>
      {footer && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: theme.headerBorder,
          background: theme.headerBg,
          ...TYPOGRAPHY_SCALE.LABEL_SM,
          opacity: 0.6,
          color: theme.text
        }}>
          {footer}
        </div>
      )}
    </motion.div>
  );
};
