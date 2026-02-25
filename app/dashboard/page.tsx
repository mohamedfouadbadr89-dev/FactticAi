"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import './styles.css';
import { TelemetryIntegrityManager, type SignedKPIPayload } from '@/lib/telemetryIntegrity';
import { GridContainer } from './components/GridContainer';
import { PanelBase } from './components/PanelBase';
import { StickyAlertZone } from './components/StickyAlertZone';
import { DashboardTier, TIER_SPANS, EXECUTIVE_PANELS, TECHNICAL_PANELS, type PanelConfig } from './components/TierPriority';
import { getPerspectiveForRole, type PerspectiveMode } from './components/RolePerspective';
import { Role } from '@/core/rbac';
import { StatusBadge } from './components/StatusBadge';
import { RISK_COLORS, type RiskLevel } from './components/riskColorMap';
import { TYPOGRAPHY_SCALE } from './components/typographyScale';
import { HoverInsight } from './components/HoverInsight';
import { TraceDrawer } from './components/TraceDrawer';
import { StructuredRCA, type RCAFactor } from './components/StructuredRCA';

function SystemStatusStrip({ isExecutive }: { isExecutive: boolean }) {
  const pulseProps = {
    animate: { opacity: [0.4, 0.8, 0.4] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as any }
  };

  return (
    <div className="system-status-strip">
      <span>ENV: PRODUCTION</span>
      <span>REGION: US-EAST-1</span>
      <motion.span {...pulseProps} style={{ color: RISK_COLORS.LOW.text }}>
        TELEMETRY: VERIFIED
      </motion.span>
      <span>SYNC: ACTIVE</span>
      <span>VERSION: v5.2.0</span>
    </div>
  );
}

function Sparkline({ level = 'LOW', isExecutive }: { level?: RiskLevel | 'LOW', isExecutive: boolean }) {
  const color = RISK_COLORS[level as RiskLevel]?.text || RISK_COLORS.LOW.text;
  return (
    <motion.div 
      style={{ position: 'relative', width: '100%', height: '40px' }}
      whileHover="hover"
    >
      <svg width="100%" height="40" viewBox="0 0 200 40" preserveAspectRatio="none">
        <motion.path 
          d="M0 35 L20 25 L40 30 L60 15 L80 20 L100 5 L120 18 L140 10 L160 25 L180 15 L200 20" 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.line 
          variants={{ hover: { opacity: 1, x: 100 } }}
          initial={{ opacity: 0 }}
          x1="0" y1="0" x2="0" y2="40"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      </svg>
    </motion.div>
  );
}

/**
 * Dashboard Surface Lock (v5.0.0)
 * Institutional Governance Monitor with Role-Based Perspective Engine
 */
export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<SignedKPIPayload | null>(null);
  const [integrityError, setIntegrityError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [drawerConfig, setDrawerConfig] = useState<{ open: boolean, title: string, data: any } | null>(null);
  const [evaluationStream, setEvaluationStream] = useState<{ interaction_id: string, total_risk: number, factors: RCAFactor[] } | null>(null);
  const [executiveState, setExecutiveState] = useState<{
    governance_health: number;
    drift: number;
    risk_state: string;
    isolation_state: string;
    anomaly_flag: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchDashboardState() {
      try {
        // 1. Fetch authenticated context
        const roleRes = await fetch('/api/auth/me');
        if (roleRes.ok) {
          const authData = await roleRes.json();
          setUserRole(authData.organization?.role || 'viewer');
        } else {
          console.warn('[DASHBOARD] AUTH_FAILURE, redirecting to login');
          router.push('/login');
          return;
        }


        // 2. Fetch signed telemetry
        const res = await fetch('/api/telemetry/signed');
        const payload: SignedKPIPayload = await res.json();
        
        const isValid = TelemetryIntegrityManager.validatePayload(payload);
        if (!isValid) {
          setIntegrityError('TELEMETRY_DESYNC_DETECTED: Invalid or Tampered Payload');
          return;
        }

        setData(payload);

        // 3. Fetch Executive State (v5.3.0)
        const execRes = await fetch(`/api/governance/executive-state`);
        if (execRes.ok) {
          const execData = await execRes.json();
          setExecutiveState(execData.data);
        }
      } catch (err) {
        console.error('[DASHBOARD] FETCH_ERROR:', err);
        setIntegrityError('NETWORK_ERROR: Failed to fetch certified dashboard state');
      }

    }
    fetchDashboardState();

    // 3. Setup SSE for Real-time Risk Telemetry
    let eventSource: EventSource | null = null;
    if (userRole) {
      eventSource = new EventSource(`/api/governance/stream`);
      
      eventSource.addEventListener('RISK_UPDATE', (event) => {
        try {
          const update = JSON.parse(event.data);
          if (update.type === 'TURN_RISK_UPDATE') {
            console.log('[DASHBOARD] REAL_TIME_RISK_UPDATE:', update);
            setEvaluationStream({
              interaction_id: update.interaction_id,
              total_risk: update.total_risk,
              factors: update.factors
            });
          }
        } catch (err) {
          console.error('[DASHBOARD] SSE_PARSE_ERROR:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.warn('[DASHBOARD] SSE_CONNECTION_LOST, retrying...', err);
        eventSource?.close();
      };
    }

    return () => {
      eventSource?.close();
    };
  }, [userRole]);

  const perspective: PerspectiveMode = useMemo(() => {
    if (!userRole) return 'executive';
    return getPerspectiveForRole(userRole);
  }, [userRole]);

  const activePanels = useMemo(() => {
    const configs = perspective === 'executive' ? EXECUTIVE_PANELS : TECHNICAL_PANELS;
    return [...configs].sort((a, b) => a.tier - b.tier);
  }, [perspective]);

  if (integrityError) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <PanelBase span={12} title="INTEGRITY LOCK ACTIVE" actions={<StatusBadge level="CRITICAL" />}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--status-critical)' }}>{integrityError}</p>
          </div>
        </PanelBase>
      </div>
    );
  }

  if (!data || !userRole) return <div className="dashboard-container"><h1>Initializing Secure Perspective...</h1></div>;

  const isExecutive = perspective === 'executive';

  const closeDrawer = () => setDrawerConfig(prev => prev ? { ...prev, open: false } : null);
  
  const openTrace = (id: string, title: string) => {
    const traceMetadata = {
      health: {
        source: 'AGENT_TELEMETRY_v5',
        boundary: 'US-EAST-1-VPC-A',
        version: 'v5.2.0-STABLE',
        hash: 'sha256:7f8e...9a2b',
        isolation: 'ORG_ISOLATION_LOCKED',
        logicLines: ['fetch_kpi_stream()', 'apply_risk_weight(0.4)', 'normalize_scores()']
      },
      drift: {
        source: 'STATISTICAL_ENGINE_v2',
        boundary: 'GLOBAL_AGGREGATOR',
        version: 'v1.1.0-TS',
        hash: 'sha256:3d2f...1c5e',
        isolation: 'DATA_SILO_ENFORCED',
        logicLines: ['calc_delta(p50, p95)', 'detect_drift_spikes()', 'verify_sigma(3)']
      },
      risk: {
        source: 'GOVERNANCE_CORE_v1',
        boundary: 'SECURITY_CONTROL_PLANE',
        version: 'v3.0.4-SEC',
        hash: 'sha256:a9b8...e4f3',
        isolation: 'RBAC_TENANT_ISOLATION',
        logicLines: ['audit_policy_compliance()', 'calc_residual_risk()', 'verify_signatures()']
      }
    };
    
    setDrawerConfig({
      open: true,
      title,
      data: traceMetadata[id as keyof typeof traceMetadata] || traceMetadata.health
    });
  };

  return (
    <div 
      className={`dashboard-container ${!isExecutive ? 'dark' : ''}`}
      style={{
        backgroundColor: isExecutive ? '#f8fafc' : '#020617',
        color: isExecutive ? '#0f172a' : '#f8fafc',
        transition: 'background-color 0.3s ease',
      }}
    >
      <SystemStatusStrip isExecutive={isExecutive} />
      
      {drawerConfig && (
        <TraceDrawer 
          isOpen={drawerConfig.open} 
          onClose={closeDrawer} 
          title={drawerConfig.title} 
          data={drawerConfig.data} 
          perspective={perspective}
        />
      )}
      
      <div className="dashboard-inner-container">
        <StickyAlertZone alerts={data.metrics.riskLevel === 'CRITICAL' ? ['Active Risk Threshold Breached: Determinism Watch Active'] : []} />
        
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ ...TYPOGRAPHY_SCALE.HEADING_LG, margin: 0 }}>Institutional Control Surface</h1>
            <p style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.4, marginTop: '0.25rem' }}>
              PERSPECTIVE: {perspective.toUpperCase()} | IDENTITY: {userRole.toUpperCase()} | COMPLIANCE_LOCK: ACTIVE
            </p>
          </div>
          <StatusBadge level="SOVEREIGN" />
        </header>

        <GridContainer>
          {/* ROW 1: GOVERNANCE HERO PANEL (12 columns) */}
          <PanelBase 
            title="Unified Governance Control" 
            span={12} 
            density={isExecutive ? 'executive' : 'command'}
            onInspect={() => openTrace('health', 'Unified Governance Control')}
            actions={<div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <StatusBadge level="CERTIFIED" />
              <StatusBadge level="STABLE" />
            </div>}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: '4rem'
            }}>
              <div style={{ flex: '0 0 auto' }}>
                <HoverInsight 
                  isExecutive={isExecutive}
                  content={{ 
                    formula: '(1 - risk) * stability_index', 
                    samples: '4.2k events', 
                    timestamp: new Date().toISOString().split('T')[0], 
                    confidence: 'HIGH_PRECISION' 
                  }}
                >
                  <MetricBlock 
                    label="GOVERNANCE_HEALTH" 
                    value={executiveState ? `${executiveState.governance_health}%` : `${data.metrics.healthScore}%`} 
                    level={executiveState ? (executiveState.governance_health < 30 ? 'CRITICAL' : executiveState.governance_health < 60 ? 'MEDIUM' : 'LOW') : 'LOW'} 
                    large 
                    isExecutive={isExecutive}
                  />
                </HoverInsight>
              </div>
              
              <div style={{ flex: 1, height: '40px' }}>
                <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.3, marginBottom: '0.5rem' }}>30D_GOVERNANCE_DELTA</div>
                <Sparkline level={executiveState ? (executiveState.risk_state as RiskLevel) : (data.metrics.riskLevel as RiskLevel)} isExecutive={isExecutive} />
              </div>

              <div style={{ 
                flex: '0 0 auto',
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '3rem'
              }}>
                <HoverInsight 
                  isExecutive={isExecutive}
                  content={{ 
                    formula: 'abs(expected - actual) / baseline', 
                    samples: '1.8k spikes', 
                    timestamp: new Date().toISOString().split('T')[0], 
                    confidence: 'NOMINAL' 
                  }}
                >
                  <MetricBlock 
                    label="DRIFT" 
                    value={executiveState ? `${executiveState.drift.toFixed(2)}` : `${data.metrics.drift}%`} 
                    level={executiveState ? (Math.abs(executiveState.drift) > 0.05 ? 'MEDIUM' : 'LOW') : (data.metrics.drift > 5 ? 'MEDIUM' : 'LOW')} 
                    isExecutive={isExecutive} 
                    specialBloom={executiveState ? Math.abs(executiveState.drift) > 0.08 : data.metrics.drift > 8} 
                  />
                </HoverInsight>
                <MetricBlock 
                  label="ISOLATION" 
                  value={executiveState ? executiveState.isolation_state : "LOCKED"} 
                  level="LOW" 
                  isExecutive={isExecutive} 
                />
                <HoverInsight 
                  isExecutive={isExecutive}
                  content={{ 
                    formula: 'threat_surface + residual_exposure', 
                    samples: '900 vectors', 
                    timestamp: new Date().toISOString().split('T')[0], 
                    confidence: 'DETERMINISTIC' 
                  }}
                >
                  <MetricBlock 
                    label="RISK_STATE" 
                    value={executiveState ? executiveState.risk_state : data.metrics.riskLevel} 
                    level={executiveState ? (executiveState.risk_state as RiskLevel) : (data.metrics.riskLevel as RiskLevel)} 
                    isExecutive={isExecutive} 
                    specialBloom={executiveState ? executiveState.anomaly_flag : false}
                  />
                </HoverInsight>
              </div>
            </div>
          </PanelBase>

        {/* ROW 1.5: Live Risk Attribution Layer (New) */}
        <AnimatePresence>
          {evaluationStream && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ gridColumn: 'span 12', overflow: 'hidden' }}
            >
              <PanelBase 
                title="Live Risk Attribution" 
                span={12} 
                density={isExecutive ? 'executive' : 'command'}
                onInspect={() => {
                  setDrawerConfig({
                    open: true,
                    title: 'Live Turn Analysis',
                    data: {
                      source: 'LIVE_TURN_ENGINE_V1',
                      boundary: 'US-EAST-1-VPC-A',
                      version: 'V5.2.0-STABLE',
                      hash: 'REALTIME_STREAM_ACTIVE',
                      isolation: 'STABLE',
                      logicLines: evaluationStream.factors.map(f => `${f.type}: weight=${f.weight}`)
                    }
                  });
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5 }}>ACTIVE_TURN_ID</div>
                    <div style={{ ...TYPOGRAPHY_SCALE.MONO_AUDIT }}>{evaluationStream.interaction_id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5 }}>INCREMENTAL_RISK</div>
                    <div style={{ ...TYPOGRAPHY_SCALE.HEADING_LG, color: evaluationStream.total_risk > 0.5 ? 'var(--status-critical)' : 'var(--status-low)' }}>
                      {(evaluationStream.total_risk * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <StructuredRCA 
                  factors={evaluationStream.factors} 
                  perspective={perspective} 
                  interactionId={evaluationStream.interaction_id}
                />
              </PanelBase>
              <div style={{ height: '1.5rem' }} /> {/* Gutter */}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ROW 2: Analytical Depth (4 cols each) */}
        <PanelBase 
          title="Drift Trend" 
          span={4} 
          density={isExecutive ? 'executive' : 'command'}
          onInspect={() => openTrace('drift', 'Drift Trend')}
        >
          <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            {[40, 60, 45, 70, 55, 80, 75].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: RISK_COLORS.LOW.bg, border: `1px solid ${RISK_COLORS.LOW.border}` }} />
            ))}
          </div>
          <p style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5, marginTop: '1rem' }}>30D_GOVERNANCE_STABILITY</p>
        </PanelBase>

        <PanelBase 
          title="Risk Distribution" 
          span={4} 
          density={isExecutive ? 'executive' : 'command'}
          onInspect={() => openTrace('risk', 'Risk Distribution')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '85%', height: '100%', background: RISK_COLORS.LOW.text }} />
            </div>
            <p style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5 }}>RESIDUAL_RISK_CONCENTRATION: 85% LOW</p>
          </div>
        </PanelBase>

        <PanelBase title="Agent Comparison" span={4} density={isExecutive ? 'executive' : 'command'}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, ...TYPOGRAPHY_SCALE.LABEL_SM }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>PROD_v4</span> <span style={{ color: RISK_COLORS.LOW.text }}>99.9%</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span>BETA_v5</span> <span style={{ color: RISK_COLORS.LOW.text }}>99.7%</span>
            </li>
          </ul>
        </PanelBase>

        {/* ROW 3: Operational Capacity (6/6 layout) */}
        <PanelBase 
          title="Concurrency Visibility" 
          span={6} 
          density={isExecutive ? 'executive' : 'command'}
          footer={`MAX_CAPACITY: 5000 | CURRENT_LOAD: ${data.metrics.concurrency || 3300}`}
        >
          <div style={{ ...TYPOGRAPHY_SCALE.METRIC_XL }}>{data.metrics.concurrency || 3300}</div>
          <p style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5 }}>ACTIVE_SESSIONS_US_EAST_1</p>
        </PanelBase>

        <PanelBase 
          title="Billing Risk / Burn Rate" 
          span={6} 
          density={isExecutive ? 'executive' : 'command'}
          actions={<StatusBadge level="STABLE" />}
        >
          <div style={{ ...TYPOGRAPHY_SCALE.METRIC_XL }}>0.00%</div>
          <p style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.5 }}>BILLING_DRIFT_LEAKAGE</p>
        </PanelBase>
      </GridContainer>
      </div>
    </div>
  );
}

function MetricBlock({ 
  label, 
  value, 
  level = 'LOW', 
  large = false, 
  isExecutive = true,
  specialBloom = false
}: { 
  label: string, 
  value: string, 
  level?: RiskLevel | 'LOW', 
  large?: boolean,
  isExecutive?: boolean,
  specialBloom?: boolean
}) {
  const color = RISK_COLORS[level as RiskLevel]?.text || RISK_COLORS.LOW.text;
  
  return (
    <div style={{ textAlign: large ? 'left' : 'right', position: 'relative' }}>
      <div style={{ ...TYPOGRAPHY_SCALE.LABEL_SM, opacity: 0.4, marginBottom: '0.25rem' }}>{label}</div>
      <motion.div 
        animate={{ 
          color: color,
          textShadow: specialBloom ? [`0 0 0px ${color}`, `0 0 15px ${color}`, `0 0 0px ${color}`] : 'none'
        }}
        transition={{ 
          duration: isExecutive ? 0.24 : 0.16,
          textShadow: { duration: 0.4, repeat: specialBloom ? Infinity : 0 }
        }}
        style={{ 
          ...(large ? TYPOGRAPHY_SCALE.METRIC_XL : TYPOGRAPHY_SCALE.HEADING_LG), 
          lineHeight: 1
        }}
      >
        {value}
      </motion.div>
    </div>
  );
}
