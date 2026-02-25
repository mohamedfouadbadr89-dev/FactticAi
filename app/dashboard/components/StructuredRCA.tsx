import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TYPOGRAPHY_SCALE } from './typographyScale';
import { RISK_COLORS } from './riskColorMap';

export interface RCAFactor {
  type: 'hallucination' | 'boundary' | 'tone';
  weight: number;
}

interface StructuredRCAProps {
  factors: RCAFactor[];
  perspective?: 'executive' | 'command';
  interactionId?: string;
}

const TYPE_LABELS = {
  hallucination: 'HALLUCINATION_RESISTANCE',
  boundary: 'BOUNDARY_ADHERENCE',
  tone: 'TONE_COMPLIANCE'
};

const TYPE_DESCRIPTIONS = {
  hallucination: 'Faithfulness to underlying source data.',
  boundary: 'Regional and organizational residency constraints.',
  tone: 'Institutional voice and safety alignment.'
};

export const StructuredRCA: React.FC<StructuredRCAProps> = ({ 
  factors, 
  perspective = 'executive',
  interactionId
}) => {
  const isExecutive = perspective === 'executive';

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5, marginBottom: '1rem' }}>
        STRUCTURED_RCA_DECOMPOSITION
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {factors.map((factor, index) => {
          const intensity = factor.weight;
          const level = intensity > 0.5 ? 'CRITICAL' : intensity > 0.2 ? 'HIGH' : 'LOW';
          const color = RISK_COLORS[level as keyof typeof RISK_COLORS].text;

          return (
            <motion.div
              key={factor.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                padding: isExecutive ? '1rem' : '0.75rem',
                background: isExecutive ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                borderLeft: `2px solid ${color}`,
                borderRadius: '0 4px 4px 0'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, color }}>
                  {TYPE_LABELS[factor.type]}
                </div>
                {!isExecutive && (
                  <div style={{ ...TYPOGRAPHY_SCALE.MONO_AUDIT, opacity: 0.4 }}>
                    WEIGHT: {factor.weight.toFixed(2)}
                  </div>
                )}
              </div>

              {isExecutive ? (
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem', opacity: 0.7 }}>
                  {level} impact on turn integrity. {TYPE_DESCRIPTIONS[factor.type]}
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.weight * 100}%` }}
                      style={{ height: '100%', background: color }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '10px', opacity: 0.3 }}>TRACE: {interactionId?.slice(0, 8)}...</div>
                    <div style={{ fontSize: '10px', opacity: 0.5, color }}>SLA_COMPLIANT</div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
