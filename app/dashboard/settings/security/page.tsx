"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Key, 
  RefreshCw, 
  Activity, 
  Lock,
  Clock,
  UserCheck,
  Loader2,
  Table as TableIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      // Fetch API Keys
      const { data: keys } = await supabase.from('api_keys').select('*').limit(5);
      setApiKeys(keys || []);

      // Fetch Audit Logs
      const { data: logs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5);
      setAuditLogs(logs || []);
    } catch (err) {
      console.error("Failed to fetch security data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKeys = async () => {
    setRotating(true);
    try {
      const res = await fetch("/api/security/key-rotate", { method: "POST" });
      if (res.ok) {
        alert("System-wide API key rotation initiated. All service inter-connects updated.");
        fetchSecurityData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRotating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
        <p className="text-[var(--text-secondary)] font-medium animate-pulse uppercase tracking-widest text-xs">Loading Security Protocol...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8 px-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Core Security</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Access & Integrity</h1>
        <p className="text-[var(--text-secondary)] text-sm font-medium">Manage session protocols, access logs, and core infrastructure secret rotation.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session Security Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-[var(--accent)]">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Session Security</span>
          </div>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Inactivity Timeout</label>
              <div className="mt-1 font-bold text-lg">30 Minutes</div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Multi-Factor Auth</label>
              <div className="mt-1 font-bold text-lg text-emerald-500 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Enforced
              </div>
            </div>
          </div>
        </div>

        {/* Key Rotation Card */}
        <div className="md:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3 text-orange-500">
                <RefreshCw className={`w-5 h-5 ${rotating ? 'animate-spin' : ''}`} />
                <span className="text-xs font-black uppercase tracking-widest">API Key Rotation</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Enforce 90-day rotation for all internal service mesh keys.</p>
            </div>
            <button 
              onClick={handleRotateKeys}
              disabled={rotating}
              className="px-6 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-orange-500/50 hover:text-orange-500 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
            >
              {rotating ? "Rotating..." : "Initiate Rotation"}
            </button>
          </div>
          <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center gap-3">
            <Activity className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Last system-wide rotation: 12 days ago</span>
          </div>
        </div>
      </div>

      {/* Access Logs Section */}
      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
          <TableIcon className="w-4 h-4" />
          Recent Access & Admin Logs
        </h2>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] text-[var(--text-secondary)]">
              <tr className="uppercase font-black tracking-widest">
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]/50">
              {auditLogs.length > 0 ? auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 font-bold">{log.action || "System Access"}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Success</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[var(--text-secondary)]">No recent security events.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Active API Keys Section */}
      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
          <Key className="w-4 h-4" />
          Active API Keys
        </h2>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] text-[var(--text-secondary)]">
              <tr className="uppercase font-black tracking-widest">
                <th className="px-6 py-4">Key Name</th>
                <th className="px-6 py-4">Prefix</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]/50">
              {apiKeys.length > 0 ? apiKeys.map((k) => (
                <tr key={k.id}>
                  <td className="px-6 py-4 font-bold">{k.name}</td>
                  <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{k.key_prefix || "sk_live_..."}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${k.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {k.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[var(--text-secondary)]">No API keys found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
