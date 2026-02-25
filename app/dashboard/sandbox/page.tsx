'use client';

import React, { useState, useEffect } from 'react';
import '../styles.css';
import './styles.css';
import { TelemetryIntegrityManager, type SignedKPIPayload } from '@/lib/telemetryIntegrity';

/**
 * Sandbox Surface (v1)
 * Interactive testing environment for Chat and Voice capabilities.
 * Enforces deterministic billing and telemetry validation.
 */
export default function SandboxPage() {
  const [mode, setMode] = useState<'chat' | 'voice'>('chat');
  const [telemetry, setTelemetry] = useState<SignedKPIPayload | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>(['[SYSTEM] Sandbox environment initialized. Ready for test interactions.']);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const res = await fetch('/api/telemetry/signed');
        const payload = await res.json();
        if (TelemetryIntegrityManager.validatePayload(payload)) {
          setTelemetry(payload);
        }
      } catch (err) {
        setLogs(prev => [...prev, '[ERROR] Failed to fetch certified telemetry.']);
      }
    }
    fetchTelemetry();
  }, []);

  const runInteraction = async () => {
    setIsProcessing(true);
    setLogs(prev => [...prev, `[USER] Initiating ${mode} interaction...`]);

    try {
      const res = await fetch('/api/billing/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_jwt',
        },
        body: JSON.stringify({
          type: 'sandbox_use',
          units: 1,
          metadata: { mode, interactionId: Math.random().toString(36).substring(7) }
        })
      });

      const result = await res.json();

      if (res.ok) {
        setLogs(prev => [...prev, `[SUCCESS] ${mode.toUpperCase()} request processed. EU Deducted: 0.1`]);
        setLogs(prev => [...prev, `[SYSTEM] Remaining Quota: ${result.data.remaining_quota.toFixed(2)} EU`]);
      } else {
        setLogs(prev => [...prev, `[FAILURE] Interaction blocked: ${result.error}`]);
      }
    } catch (err) {
      setLogs(prev => [...prev, '[ERROR] Network failure during interaction.']);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="sandbox-container">
      <div className="test-environment-banner">
        ⚠️ TEST ENVIRONMENT - Governance Integrity Active ⚠️
      </div>

      <header style={{ gridColumn: 'span 12', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Interactive Sandbox</h1>
        <p style={{ color: 'var(--text-muted)' }}>Validate institutional workflows with deterministic billing.</p>
      </header>

      <div className="sandbox-panel">
        <div className="sandbox-header">
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className={`btn ${mode === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('chat')}
            >
              Chat Sandbox
            </button>
            <button 
              className={`btn ${mode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('voice')}
            >
              Voice Sandbox
            </button>
          </div>
          <div className="cost-indicator">
            COST: 0.1 EU / Interaction
          </div>
        </div>

        <div className="sandbox-body">
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '0.25rem', color: log.startsWith('[ERROR]') || log.startsWith('[FAILURE]') ? 'var(--status-critical)' : 'inherit' }}>
              {log}
            </div>
          ))}
          {isProcessing && <div style={{ color: 'var(--status-neutral)' }}>[PROCESSING] Computing deterministic response...</div>}
        </div>

        <div className="sandbox-footer">
          <button 
            className="btn btn-primary" 
            onClick={runInteraction}
            disabled={isProcessing}
            style={{ width: '100%' }}
          >
            {mode === 'chat' ? 'Send Test Message' : 'Initiate Test Call'}
          </button>
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 6' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Integrity Guard</h3>
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Telemetry Bonded:</span>
            <span className={`status-pill ${telemetry ? 'stable' : 'warning'}`}>{telemetry ? 'VERIFIED' : 'PENDING'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Billing RPC:</span>
            <span className="status-pill stable">DETERMINISTIC</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Org Isolation:</span>
            <span className="status-pill stable">ACTIVE</span>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '6px', fontSize: 'var(--text-xs)' }}>
          <strong>Legal Disclaimer:</strong> Interactions in the sandbox are recorded in the institutional audit journal for compliance purposes.
        </div>
      </div>
    </div>
  );
}
