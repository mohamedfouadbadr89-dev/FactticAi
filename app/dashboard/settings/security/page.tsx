"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Key, 
  RefreshCw, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  Fingerprint,
  Info,
  Loader2,
  Lock
} from "lucide-react";

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/security/byok");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch BYOK status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!newKey || newKey.length < 32) return;
    setSaving(true);
    try {
      const res = await fetch("/api/security/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey })
      });
      if (res.ok) {
        setShowForm(false);
        setNewKey("");
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!confirm("Are you sure you want to reset your encryption configuration? This will fallback to system keys for new data.")) return;
    try {
      await fetch("/api/security/byok", { method: "DELETE" });
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
        <p className="text-[var(--text-secondary)] font-medium animate-pulse uppercase tracking-widest text-xs">Authenticating Vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 px-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Security</span>
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Security & Encryption</h1>
        <p className="text-[var(--text-secondary)] text-sm font-medium">Manage organization-level encryption keys and bring your own key (BYOK) architecture.</p>
      </header>

      {/* Section 1: BYOK Management */}
      <section className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-8 space-y-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Encryption Key Management (BYOK)</h2>
                <p className="text-sm text-[var(--text-secondary)]">Encrypted at rest using AES-256-GCM.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               {data.is_configured ? (
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                   <ShieldCheck className="w-3 h-3" /> Active
                 </span>
               ) : (
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                   <AlertTriangle className="w-3 h-3" /> Not Configured
                 </span>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="p-5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                   <Fingerprint className="w-3 h-3 text-[var(--accent)]" /> 
                   Key Fingerprint
                </div>
                <div className="font-mono text-lg font-bold">
                  {data.is_configured ? `••••••••${data.fingerprint}` : "N/A"}
                </div>
             </div>
             <div className="p-5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                   <RefreshCw className="w-3 h-3 text-[var(--accent)]" /> 
                   Last Rotated
                </div>
                <div className="font-bold text-lg">
                   {data.last_rotated ? new Date(data.last_rotated).toLocaleDateString() : "Never"}
                </div>
             </div>
          </div>

          {!showForm ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all shadow-lg shadow-[var(--accent)]/20"
              >
                {data.is_configured ? "Rotate Master Key" : "Configure Master Key"}
              </button>
              {data.is_configured && (
                <button 
                  onClick={handleDeleteConfig}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/5 text-red-500 border border-red-500/20 hover:bg-red-500/10 rounded-xl font-bold text-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Reset Configuration
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 bg-[var(--bg-primary)] border-2 border-[var(--accent)]/30 rounded-3xl space-y-6 animate-in zoom-in-95 duration-200">
               <div className="space-y-2">
                  <h3 className="font-bold">Enter Encryption Master Key</h3>
                  <p className="text-xs text-[var(--text-secondary)]">This key must be at least 32 characters. Facttic never stores the raw key; it is immediately hashed and encrypted.</p>
               </div>
               <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                  <input 
                    type="password"
                    placeholder="Enter raw AES-256 key material..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[var(--accent)] font-mono transition-all"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                  />
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    disabled={saving || newKey.length < 32}
                    onClick={handleSaveKey}
                    className="flex-1 py-4 bg-[var(--accent)] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : "Operationalize Key"}
                  </button>
                  <button 
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[var(--bg-primary)] transition-all"
                  >
                    Cancel
                  </button>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Instructions */}
      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
          Webhook Integration
          <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
        </h2>
        
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[32px] p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-lg">X-BYOK-KEY Header</h3>
            <p className="text-sm text-[var(--text-secondary)]">To utilize BYOK encryption for incoming streams, you must include your master key as an SHA-256 header in your webhook calls.</p>
          </div>

          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-sm relative group">
             <div className="text-[var(--accent)] mb-2 uppercase text-[10px] font-black">Request Header Example</div>
             <code className="text-[var(--text-primary)]">
               x-byok-key: 2f7300c... (your-key-fingerprint)
             </code>
             <button 
               onClick={() => copyToClipboard("x-byok-key: ")}
               className="absolute top-4 right-4 p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg hover:text-[var(--accent)] transition-all opacity-0 group-hover:opacity-100"
             >
               {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
             </button>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
             <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
             <div className="space-y-1">
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Security Protocol</span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  When BYOK headers are present, Facttic's gateway bypasses its own system encryption and uses your unique key for the atomic write operation. If you rotate your key here, ensure you update your downstream webhook proxies.
                </p>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
