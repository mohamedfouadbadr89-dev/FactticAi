import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPOGRAPHY_SCALE } from './typographyScale';
import { StatusBadge } from './StatusBadge';

interface TraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: {
    source: string;
    boundary: string;
    version: string;
    hash: string;
    isolation: string;
    logicLines?: string[];
  };
  perspective?: 'executive' | 'command';
}

export const TraceDrawer: React.FC<TraceDrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  data, 
  perspective = 'executive' 
}) => {
  const isExecutive = perspective === 'executive';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000
            }}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              background: isExecutive ? '#ffffff' : '#0f172a',
              color: isExecutive ? '#0f172a' : '#f8fafc',
              borderLeft: isExecutive ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
              padding: '2rem',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
              zIndex: 2001,
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ ...TYPOGRAPHY_SCALE.HEADING_LG, margin: 0 }}>Metric Trace</h2>
                <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5 }}>{title}</div>
              </div>
              <button 
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  opacity: 0.5
                }}
              >
                ✕
              </button>
            </div>

            <section style={{ marginBottom: '2rem' }}>
              <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.4, marginBottom: '1rem' }}>FORENSIC_METADATA</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <TraceField label="DATA_SOURCE" value={data.source} />
                <TraceField label="COMPUTATION_BOUNDARY" value={data.boundary} />
                <TraceField label="VERSION_TAG" value={data.version} />
                <TraceField label="INTEGRITY_HASH" value={data.hash} monospace />
                <div>
                  <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.4, marginBottom: '0.25rem' }}>ISOLATION_PROOF</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge level="STABLE" /> {/* Using STABLE as proxy for verified isolation */}
                    <span style={{ ...TYPOGRAPHY_SCALE.LABEL_SM }}>{data.isolation}</span>
                  </div>
                </div>
              </div>
            </section>

            {!isExecutive && data.logicLines && (
              <section>
                <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.4, marginBottom: '1rem' }}>COMPUTATION_STAGES (COMMAND_ONLY)</div>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                  opacity: 0.8
                }}>
                  {data.logicLines.map((line, i) => <div key={i}>{`> ${line}`}</div>)}
                </div>
              </section>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const TraceField = ({ label, value, monospace = false }: { label: string, value: string, monospace?: boolean }) => (
  <div>
    <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.4, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ 
      ...TYPOGRAPHY_SCALE.LABEL_SM, 
      fontFamily: monospace ? 'monospace' : 'inherit',
      wordBreak: 'break-all'
    }}>
      {value}
    </div>
  </div>
);
