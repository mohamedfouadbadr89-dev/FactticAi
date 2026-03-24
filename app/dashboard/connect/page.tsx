"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConnectionWizard from "@/components/setup/ConnectionWizard";
import { 
  ShieldCheck, 
  Plus, 
  Activity, 
  Bot, 
  Server, 
  Trash2, 
  ExternalLink, 
  Loader2,
  RefreshCw,
  Clock,
  Lock,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getProviderStatus, HealthStatus } from "@/lib/integrations/providerHealth";

interface Connection {
  id: string;
  provider_type: string;
  interaction_mode: string;
  model: string;
  status?: string;
  created_at: string;
  health?: HealthStatus;
  latency?: number;
}

export default function ConnectionPage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [byokStatus, setByokStatus] = useState<any>(null);

  const fetchConnections = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('ai_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const initialConnections = (data || []).map(c => ({ ...c, health: 'Connected' as HealthStatus }));
      setConnections(initialConnections);
      
      // Fetch actual health status for each
      initialConnections.forEach(async (conn) => {
        const health = await getProviderStatus(conn.id);
        setConnections(prev => prev.map(p => p.id === conn.id ? { ...p, health: health.status, latency: health.latency } : p));
      });

    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchByokStatus = async () => {
    try {
      const res = await fetch("/api/security/byok");
      const json = await res.json();
      setByokStatus(json);
    } catch (err) {
      console.error("Failed to fetch BYOK status:", err);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchByokStatus();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this provider?")) return;
    try {
      const { error } = await supabase
        .from('ai_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchConnections();
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const getProviderIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'openai': return <Bot className="w-5 h-5 text-green-500" />;
      case 'anthropic': return <Bot className="w-5 h-5 text-orange-500" />;
      case 'azure': return <Server className="w-5 h-5 text-blue-500" />;
      case 'elevenlabs':
      case 'vapi':
      case 'retell':
      case 'bland': return <Activity className="w-5 h-5 text-[var(--accent)]" />;
      default: return <Server className="w-5 h-5 text-[var(--text-secondary)]" />;
    }
  };

  if (showWizard) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <button 
              onClick={() => setShowWizard(false)}
              className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
            >
              ← Back to Connections
            </button>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[var(--accent)]" />
              <span className="font-black uppercase tracking-widest text-xs">Security Mode: Active</span>
            </div>
          </header>
          <main className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 shadow-sm">
            <ConnectionWizard onComplete={() => { setShowWizard(false); fetchConnections(); }} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Infrastructure</h1>
              <p className="text-[var(--text-secondary)] text-sm font-medium">Manage and secure your organization's AI constellation.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus className="w-4 h-4" />
            Connect Provider
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
            <p className="text-[var(--text-secondary)] font-medium animate-pulse">Scanning orchestration layer...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-primary)] rounded-3xl p-20 flex flex-col items-center text-center space-y-6">
            <div className="p-6 rounded-full bg-[var(--bg-primary)] border border-[var(--border-primary)]">
              <Server className="w-12 h-12 text-[var(--text-secondary)] opacity-50" />
            </div>
            <div className="max-w-md">
              <h3 className="text-xl font-bold mb-2">No Active Connections</h3>
              <p className="text-[var(--text-secondary)] text-sm">Your organization hasn't connected any AI infrastructure yet. Start by adding a provider to enable governance and risk scoring.</p>
            </div>
            <button 
              onClick={() => setShowWizard(true)}
              className="px-8 py-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl font-bold text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                Active Constellation
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[10px]">{connections.length}</span>
              </h2>
              <button 
                onClick={fetchConnections}
                className={`p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-all ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((conn) => (
                <div 
                  key={conn.id} 
                  className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-6 hover:border-[var(--accent)]/50 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(conn.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-5">
                    <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)]/30 transition-all">
                      {getProviderIcon(conn.provider_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg capitalize">{conn.provider_type}</h3>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-[var(--accent)]/10 text-[var(--accent)]">
                          {conn.interaction_mode || 'chat'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-2">
                        {conn.model}
                      </p>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--border-primary)]/50">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            conn.health === 'Connected' ? 'bg-green-500' : 
                            conn.health === 'Degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                            conn.health === 'Connected' ? 'text-green-500' : 
                            conn.health === 'Degraded' ? 'text-yellow-500' : 'text-red-500'
                          }`}>{conn.health || 'Checking...'}</span>
                        </div>
                        {conn.latency !== undefined && (
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <Activity className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{conn.latency}ms</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)] ml-auto">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {new Date(conn.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Encryption & Security Section — Always visible when not loading */}
        {!loading && (
          <div className="pt-10 border-t border-[var(--border-primary)] space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
              Encryption & Security
            </h2>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[var(--accent)]/30 transition-all group">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Bring Your Own Key (BYOK)</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Manage organization-level encryption keys for data at rest.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center gap-3 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${byokStatus?.is_configured ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {byokStatus?.is_configured ? 'Active' : 'Unconfigured'}
                  </span>
                </div>
                <button 
                  onClick={() => router.push('/dashboard/settings/security')}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl font-bold text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                >
                  Manage Keys
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
