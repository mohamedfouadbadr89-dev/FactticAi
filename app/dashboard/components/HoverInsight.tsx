import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPOGRAPHY_SCALE } from './typographyScale';

interface HoverInsightProps {
  children: React.ReactNode;
  content: {
    formula: string;
    samples: string;
    timestamp: string;
    confidence: string;
  };
  isExecutive?: boolean;
}

export const HoverInsight: React.FC<HoverInsightProps> = ({ children, content, isExecutive = true }) => {
  const [show, setShow] = React.useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '10px',
              width: '240px',
              padding: '1rem',
              background: isExecutive ? '#ffffff' : '#1e293b',
              border: isExecutive ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5, marginBottom: '0.25rem' }}>GOVERNANCE_LOGIC</div>
            <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, fontWeight: 600, marginBottom: '0.75rem' }}>{content.formula}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '10px', opacity: 0.4 }}>SAMPLES</div>
                <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM }}>{content.samples}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', opacity: 0.4 }}>CONFIDENCE</div>
                <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, color: 'var(--status-low)' }}>{content.confidence}</div>
              </div>
            </div>
            
            <div style={{ marginTop: '0.75rem', fontSize: '10px', opacity: 0.3 }}>
              VERIFIED: {content.timestamp}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
