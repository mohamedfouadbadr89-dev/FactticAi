'use client'

import React, { useState } from 'react';
import { ShieldAlert, Users, Activity, Settings, Plus, Lock, Globe, ServerCrash } from 'lucide-react';

const mockTenants = [
  { id: 't-1A', name: 'Acme Corporation', domain: 'acme.com', sso: true, status: 'Active', members: 42, compute: '14.2ms', plan: 'Enterprise', region: 'us-east-1' },
  { id: 't-2B', name: 'Stark Industries', domain: 'stark.com', sso: false, status: 'Active', members: 12, compute: '8.4ms', plan: 'Professional', region: 'us-west-2' },
  { id: 't-3C', name: 'Prestige Worldwide', domain: 'prestige.io', sso: true, status: 'Throttled', members: 104, compute: '89.1ms', plan: 'Enterprise Hybrid', region: 'eu-central-1' },
  { id: 't-4D', name: 'Hooli', domain: 'hooli.net', sso: false, status: 'Suspended', members: 0, compute: '-', plan: 'Trial', region: 'us-east-1' },
];

export default function SuperAdminDashboard() {
  const [tenants] = useState(mockTenants);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-[#050505] text-[var(--text-primary)]">
      {/* Sidebar Overlay */}
      <div className="w-64 border-r border-[#1a1a1a] bg-[#0a0a0a] flex flex-col">
        <div className="p-6 border-b border-[#1a1a1a]">
          <div className="flex items-center space-x-2 text-red-500 mb-1">
            <ShieldAlert size={20} />
            <span className="font-black tracking-[0.2em] text-xs">SUPER ADMIN</span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-mono">Platform Telemetry & Governance</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-[var(--accent)] text-black font-bold text-xs uppercase tracking-widest">
            <Globe size={16} />
            <span>Tenants</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[#1a1a1a] hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">
            <Activity size={16} />
            <span>Telemetry</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[#1a1a1a] hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">
            <Settings size={16} />
            <span>Global Config</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#1a1a1a]">
          <div className="text-[10px] font-mono text-[var(--text-secondary)]">Facttic OS v2.1.0-BYOC</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-[#1a1a1a] flex items-center justify-between px-8 bg-[#0a0a0a]">
          <div>
             <h1 className="text-xl font-bold tracking-tight">Tenant Fleet Management</h1>
             <p className="text-xs text-[var(--text-secondary)] font-mono mt-1">Global Instance Registry: {tenants.length} Active Nodes</p>
          </div>
          <button className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">
             <Plus size={14} />
             <span>Provision Tenant</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="section-card p-6 border-l-2 border-[var(--accent)]">
               <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Total Managed Users</div>
               <div className="text-3xl font-bold">1,842</div>
               <div className="text-xs text-green-500 mt-2 font-mono">+12% vs last month</div>
            </div>
            <div className="section-card p-6 border-l-2 border-orange-500">
               <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Global Avg Latency (P95)</div>
               <div className="text-3xl font-bold">42.8ms</div>
               <div className="text-xs text-orange-500 mt-2 font-mono">Warning: Elevated in AP-South</div>
            </div>
            <div className="section-card p-6 border-l-2 border-red-500">
               <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Active Security Breakers</div>
               <div className="text-3xl font-bold">1</div>
               <div className="text-xs text-red-500 mt-2 font-mono">Prestige.io (High Query Volume)</div>
            </div>
          </div>

          <div className="section-card overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Organization</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Domain / Identity</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Region Zone</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Plan Bounds</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Compute Latency</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-right">State</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                   {tenants.map(tenant => (
                     <tr key={tenant.id} onClick={() => setSelectedTenant(tenant.id)} className="hover:bg-[#111] cursor-pointer transition-colors">
                        <td className="p-4">
                           <div className="font-bold text-sm">{tenant.name}</div>
                           <div className="text-[10px] text-[var(--text-secondary)] font-mono">{tenant.id} • {tenant.members} seats</div>
                        </td>
                        <td className="p-4">
                           <div className="text-sm font-medium">{tenant.domain}</div>
                           <div className="flex items-center mt-1">
                              {tenant.sso ? (
                                <span className="inline-flex items-center space-x-1 text-[8px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-2 border border-green-500/20 rounded">
                                  <Lock size={8} /> <span>SSO Enforced</span>
                                </span>
                              ) : (
                                <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 border border-orange-500/20 rounded">
                                  Standard Password
                                </span>
                              )}
                           </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-[var(--text-secondary)]">
                           {tenant.region}
                        </td>
                        <td className="p-4">
                           <div className="text-xs font-mono border border-[#333] inline-block px-2 py-0.5 rounded bg-[#0a0a0a]">{tenant.plan}</div>
                        </td>
                        <td className="p-4 font-mono text-sm">
                           <span className={tenant.status === 'Throttled' ? 'text-red-500' : 'text-green-500'}>{tenant.compute}</span>
                        </td>
                        <td className="p-4 text-right">
                           {tenant.status === 'Active' && <span className="text-green-500 text-xs font-bold flex items-center justify-end"><div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"/>Active</span>}
                           {tenant.status === 'Throttled' && <span className="text-orange-500 text-xs font-bold flex items-center justify-end"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"/>Throttled</span>}
                           {tenant.status === 'Suspended' && <span className="text-red-500 text-xs font-bold flex items-center justify-end"><ServerCrash size={12} className="mr-1"/> Suspension</span>}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {selectedTenant && (
            <div className="mt-8 section-card p-6 border border-red-500/30 bg-red-500/5">
              <h3 className="text-red-500 font-bold text-sm tracking-widest uppercase mb-4 flex items-center"><ShieldAlert size={16} className="mr-2"/> Administrative Override : {selectedTenant}</h3>
              <p className="text-xs text-[var(--text-secondary)] mb-6 font-mono">WARNING: Super Admin overrides bypass normal tenant RLS restrictions. Actions taken here modify physical database boundaries directly.</p>
              
              <div className="flex space-x-4">
                <button className="bg-[#111] border border-[#333] text-white px-4 py-2 rounded text-[10px] font-black tracking-widest uppercase hover:bg-[#222]">
                  Force Token Invalidation
                </button>
                <button className="bg-[#111] border border-orange-500/50 text-orange-500 px-4 py-2 rounded text-[10px] font-black tracking-widest uppercase hover:bg-orange-500/10">
                  Throttle API Quota
                </button>
                <button className="bg-red-500 text-white px-4 py-2 rounded text-[10px] font-black tracking-widest uppercase shadow hover:bg-red-600">
                  Suspend Organization
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
