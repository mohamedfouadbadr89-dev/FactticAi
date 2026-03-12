'use client'

import React, { useState, useEffect } from 'react';
import { Save, History, Box, Globe, RotateCcw } from 'lucide-react';

export default function TenantConfigPage() {
  const [activeTab, setActiveTab] = useState<'overrides' | 'audit'>('overrides');
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    data_retention_days: 90,
    risk_threshold_offset: 0,
    require_sso: false,
    region: 'us-east-1'
  });

  // Mocked Audit Timeline 
  const auditLogs = [
    { id: 'v3', version: 3, user: 'Admin Account (You)', date: 'Oct 24, 2026', changes: ['risk_threshold_offset: 0 -> -15'] },
    { id: 'v2', version: 2, user: 'System Sync', date: 'Oct 01, 2026', changes: ['require_sso: false -> true'] },
    { id: 'v1', version: 1, user: 'Provisioning Engine', date: 'Sep 15, 2026', changes: ['Initial Tenant Creation'] }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Submit settings override JSON via `/api/settings/tenant/route.ts` bridging the PSQL trigger
    setTimeout(() => {
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      <div className="pb-6 border-b border-[var(--border-primary)] flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Tenant Configuration</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Manage hierarchical capabilities overriding global Facttic parameters.</p>
        </div>
        <div className="flex border border-[var(--border-primary)] rounded-lg p-1 bg-[var(--bg-secondary)]">
          <button 
            onClick={() => setActiveTab('overrides')}
            className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded transition-colors ${activeTab === 'overrides' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Overrides
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded transition-colors flex items-center ${activeTab === 'audit' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <History size={12} className="mr-1.5" /> Audit V3
          </button>
        </div>
      </div>

      {activeTab === 'overrides' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="section-card p-8">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 border-l-2 border-[var(--accent)] px-3">Data Governance Overrides</h3>
               <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Risk Threshold Tolerance</label>
                       <span className="text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-primary)] font-mono text-[var(--text-primary)]">Global: 0</span>
                    </div>
                    <input type="number" value={config.risk_threshold_offset} onChange={e => setConfig({...config, risk_threshold_offset: Number(e.target.value)})}
                      className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none" placeholder="0" />
                    <p className="text-xs text-[var(--text-secondary)] mt-2">Offset base classification bindings natively. Negative values tighten sensitivity bounds.</p>
                 </div>
                 
                 <div>
                    <div className="flex justify-between items-center mb-1">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Retention Policy (Days)</label>
                       <span className="text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-primary)] font-mono text-[var(--text-primary)]">Global: 180</span>
                    </div>
                    <input type="number" value={config.data_retention_days} onChange={e => setConfig({...config, data_retention_days: Number(e.target.value)})}
                      className="w-full p-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] focus:border-[var(--accent)] outline-none" placeholder="180" />
                    <p className="text-xs text-[var(--text-secondary)] mt-2">Automatically expunge isolated rows scaling past legal requirement limitations.</p>
                 </div>
               </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2 bg-[var(--accent)] text-black px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
                 <Save size={14} /> <span>{isSaving ? 'Synchronizing...' : 'Save Tenant Overrides'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="section-card p-6 bg-blue-500/5 border border-blue-500/20">
              <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-blue-500 mb-2"><Globe size={14} className="mr-2"/> Data Localization</h4>
              <p className="text-xs text-[var(--text-secondary)] mb-4">This organization is natively bound to regional deployment architectures dictating internal routing parameters.</p>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] flex justify-between items-center mt-2">
                 <span className="text-xs font-medium text-[var(--text-primary)]">Assigned Datacenter</span>
                 <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono uppercase tracking-widest border border-blue-500/30">
                    {config.region}
                 </span>
              </div>
            </div>
            
            <div className="section-card p-6 border border-dashed border-[var(--border-primary)] shadow-none">
              <h4 className="flex items-center text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] mb-2"><Box size={14} className="mr-2"/> CI/CD Sync</h4>
              <p className="text-xs text-[var(--text-secondary)] mb-4">Map Git Webhooks into the `/api/settings/tenant` endpoint bypassing UI management layers natively.</p>
              <button className="w-full p-2 text-[10px] font-black uppercase tracking-widest text-orange-500 border border-orange-500/30 rounded bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
                 Generate Configuration Token
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="section-card p-8">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-6 border-l-2 border-[var(--accent)] px-3">Configuration Audit Trace</h3>
           <p className="text-sm text-[var(--text-secondary)] mb-8">PostgreSQL triggers automatically trace all REST permutations preserving immutability bindings via `tenant_config_versions` tables.</p>
           
           <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--accent)] before:via-[var(--border-primary)] before:to-[var(--bg-primary)]">
             {auditLogs.map((log, index) => (
               <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--bg-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <span className="text-xs font-black flex items-center"><History size={12} className="mr-0.5"/> {log.version}</span>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow">
                     <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{log.user}</span>
                        <time className="font-mono text-[10px] text-[var(--text-secondary)]">{log.date}</time>
                     </div>
                     <ul className="text-xs text-[var(--text-secondary)] space-y-1 font-mono bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-primary)]">
                        {log.changes.map((change, i) => (
                          <li key={i}>{change}</li>
                        ))}
                     </ul>
                     {index > 0 && ( /* Cannot rollback to initial unconfigured state easily here for UI demo purposes */
                        <button className="mt-4 flex items-center text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors">
                          <RotateCcw size={12} className="mr-1" /> Restore Version {log.version}
                        </button>
                     )}
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
