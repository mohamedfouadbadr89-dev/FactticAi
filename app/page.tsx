'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import './dashboard/styles.css';
import './landing.css';

/**
 * Enterprise Landing Page (v1 Locked)
 * Institutional surface for FACTTIC Governance.
 */
export default function LandingPage() {
  const [trustSummary, setTrustSummary] = useState<any>(null);

  useEffect(() => {
    async function fetchTrust() {
      try {
        const res = await fetch('/api/trust/public-summary');
        const data = await res.json();
        setTrustSummary(data);
      } catch (e) {
        console.error('Trust summary fetch failed');
      }
    }
    fetchTrust();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="status-pill sovereign" style={{ marginBottom: '2rem' }}>
          V1 PRODUCTION BASELINE ACTIVE
        </div>
        <h1 className="hero-title">Governance-First AI Operations</h1>
        <p className="hero-subtitle">
          The enterprise deterministic engine for Chat and Voice agents. 
          Hardened security, mathematical isolation, and verifiable trust.
        </p>
        <div className="cta-group">
          <button className="btn-large btn-primary-dark">Start Free Trial</button>
          <button className="btn-large btn-outline">Book Demo</button>
        </div>
        
        <div className="logo-strip">
          <span className="logo-item">VAPI</span>
          <span className="logo-item">RETELL</span>
          <span className="logo-item">WEBHOOKS</span>
          <span className="logo-item">TWILIO</span>
        </div>
      </section>

      {/* What is Facttic */}
      <section className="section-container">
        <div className="grid-2">
          <div>
            <span className="status-pill stable" style={{ marginBottom: '1rem' }}>SYSTEM_CORE_v1</span>
            <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Baseline Reality for Enterprise AI.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1.5rem' }}>
              Facttic isn't just a platform; it's a governance layer. We sit between your models and your customers, enforcing deterministic boundaries and capturing high-fidelity audit evidence.
            </p>
          </div>
          <div className="visual-preview">
            <div className="card" style={{ width: '80%', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Deterministic Lock</span>
                <span className="status-pill stable">ACTIVE</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', height: '4px', width: '100%', marginTop: '1rem', borderRadius: '2px' }}>
                <div style={{ background: 'var(--status-stable)', width: '100%', height: '100%' }}></div>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                SH256 Integrity: VERIFIED
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat + Voice Governance */}
      <section className="section-container" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem', fontWeight: 800 }}>Dual-Surface Control</h2>
        <div className="grid-2">
          <div className="feature-block">
            <h3>Chat Governance</h3>
            <p>Isolation of multi-agent interactions with real-time PII redaction and policy enforcement.</p>
            <div style={{ marginTop: '1.5rem', fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
              {'>'} EXEC_GATE: LOCKED<br/>
              {'>'} PII_FILTER: PASS
            </div>
          </div>
          <div className="feature-block">
            <h3>Voice Governance</h3>
            <p>Low-latency deterministic billing and risk projection for Retell, Vapi, and custom voice endpoints.</p>
            <div style={{ marginTop: '1.5rem', fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
              {'>'} VOICE_DETERMINISM: PASS<br/>
              {'>'} LATENCY_P99: 12ms
            </div>
          </div>
        </div>
      </section>

      {/* Governance Visuals */}
      <section className="section-container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Institutional Proof</h2>
          <p style={{ color: 'var(--text-muted)' }}>Certified telemetry updated every 300s.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div className="card">
            <h4>Compliance Radar</h4>
            <div className="visual-preview" style={{ height: '200px', marginTop: '1rem' }}>
              [Radar Visualization: {trustSummary?.controlCoverage || 0}% Coverage]
            </div>
          </div>
          <div className="card">
            <h4>Drift Trend</h4>
            <div className="visual-preview" style={{ height: '200px', marginTop: '1rem' }}>
              [Drift Monitoring: STABLE]
            </div>
          </div>
          <div className="card">
            <h4>Agent Comparison</h4>
            <div className="visual-preview" style={{ height: '200px', marginTop: '1rem' }}>
              [Isolation Proof: ACTIVE]
            </div>
          </div>
        </div>
      </section>

      {/* Deterministic Risk & Compliance */}
      <section className="section-container" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="grid-2">
          <div className="card">
            <h3>Deterministic Risk Model</h3>
            <div className="risk-gradient"></div>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              Our risk register calculates residual exposure in real-time, bound to cryptographic evidence snapshots.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="feature-block" style={{ padding: '1rem' }}>
              <strong>Hallucination Index:</strong> <span style={{ color: 'var(--status-stable)' }}>MINIMAL</span>
            </div>
            <div className="feature-block" style={{ padding: '1rem' }}>
              <strong>Multi-Agent Isolation:</strong> <span style={{ color: 'var(--status-stable)' }}>ENFORCED</span>
            </div>
            <div className="feature-block" style={{ padding: '1rem' }}>
              <strong>Sovereign Compliance:</strong> <span style={{ color: 'var(--status-stable)' }}>{trustSummary?.complianceStandard || 'LOCKED'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Final CTA */}
      <footer className="section-container" style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)' }}>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '2rem' }}>Ready to harden your AI surface?</p>
        <button className="btn-large btn-primary-dark">Deploy V1 Production Baseline</button>
        <div style={{ marginTop: '4rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          © 2026 FACTTIC.AI | HDI-v5.4 Protocol | {trustSummary?.region || 'GLOBAL'}
        </div>
      </footer>
    </main>
  );
}
