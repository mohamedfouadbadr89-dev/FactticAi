"use client";

import React, { useState } from 'react';
import { GridContainer } from '../components/GridContainer';
import { PanelBase } from '../components/PanelBase';
import '../styles.css';

export default function GridDemo() {
  const [density, setDensity] = useState<'command' | 'executive'>('executive');

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <header style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>UI System: Control Grid</h1>
          <p style={{ color: 'var(--text-muted)' }}>12-column Institutional Layout Validation</p>
        </div>
        <button 
          onClick={() => setDensity(d => d === 'executive' ? 'command' : 'executive')}
          className="card"
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}
        >
          Toggle Density: {density.toUpperCase()}
        </button>
      </header>

      <GridContainer>
        {/* Full Width */}
        <PanelBase title="Full Complexity Analysis" span={12} density={density} footer="Source: /api/telemetry/signed">
          <div style={{ height: '100px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            [12-Column Analysis Data Visualization]
          </div>
        </PanelBase>

        {/* Half Widths */}
        <PanelBase title="Region Sovereignty" span={6} density={density} statusNode={<span className="status-pill sovereign">US_EAST_1</span>}>
          <p>Verified regional residency for current cluster.</p>
        </PanelBase>
        <PanelBase title="Isolation Integrity" span={6} density={density} statusNode={<span className="status-pill stable">LOCKED</span>}>
          <p>Mathematical proof of tenant isolation active.</p>
        </PanelBase>

        {/* One-Thirds */}
        <PanelBase title="Metric A" span={4} density={density}>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>99.9%</div>
        </PanelBase>
        <PanelBase title="Metric B" span={4} density={density}>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>LOW</div>
        </PanelBase>
        <PanelBase title="Metric C" span={4} density={density}>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>0.01%</div>
        </PanelBase>

        {/* Quarters */}
        <PanelBase title="Q1" span={3} density={density}><div style={{ fontWeight: 600 }}>VALUE_1</div></PanelBase>
        <PanelBase title="Q2" span={3} density={density}><div style={{ fontWeight: 600 }}>VALUE_2</div></PanelBase>
        <PanelBase title="Q3" span={3} density={density}><div style={{ fontWeight: 600 }}>VALUE_3</div></PanelBase>
        <PanelBase title="Q4" span={3} density={density}><div style={{ fontWeight: 600 }}>VALUE_4</div></PanelBase>
      </GridContainer>
    </div>
  );
}
