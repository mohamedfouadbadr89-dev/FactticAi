'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface CreatedKey extends ApiKey {
  raw_key: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Revoke state
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/keys');
      if (!res.ok) throw new Error('Failed to load API keys');
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');

      setCreatedKey(data.key);
      setNewKeyName('');
      fetchKeys();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke key');
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch {
      // silently fail — table will refresh
    } finally {
      setRevoking(null);
      setConfirmRevoke(null);
    }
  };

  const copyKey = async () => {
    if (!createdKey?.raw_key) return;
    await navigator.clipboard.writeText(createdKey.raw_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dismissCreatedKey = () => {
    setCreatedKey(null);
    setShowRaw(false);
    setCopied(false);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">API Keys</h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            Authenticate external systems with your governance pipeline.
          </p>
        </div>
        <button
          onClick={fetchKeys}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-bold uppercase tracking-widest hover:border-[var(--accent)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* One-time key reveal modal */}
      {createdKey && (
        <div className="relative rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent-bg)] p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">
                  Key Created — Copy Now
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                This key will <strong>never be shown again.</strong> Store it securely.
              </p>
            </div>
            <button
              onClick={dismissCreatedKey}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4">
            <code className="flex-1 text-sm font-mono text-[var(--text-primary)] break-all select-all">
              {showRaw ? createdKey.raw_key : `${createdKey.key_prefix}${'•'.repeat(40)}`}
            </code>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowRaw(v => !v)}
                className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
                title={showRaw ? 'Hide' : 'Reveal'}
              >
                {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={copyKey}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  copied
                    ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                    : 'bg-[var(--accent)] text-white hover:opacity-90'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--warning)]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Key name: {createdKey.name} · Created {new Date(createdKey.created_at).toLocaleString()}
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="card p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-4">
          Create New Key
        </h3>
        <form onSubmit={handleCreate} className="flex items-center gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            placeholder="e.g. production-chatbot, staging-voice"
            maxLength={64}
            className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="submit"
            disabled={creating || !newKeyName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Creating…' : 'Create Key'}
          </button>
        </form>
        {createError && (
          <p className="mt-3 text-xs font-bold text-[var(--danger)] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {createError}
          </p>
        )}
      </div>

      {/* Keys list */}
      <div className="card overflow-hidden">
        <div className="card-header border-b border-[var(--border-primary)]">
          <h3 className="card-title">Active Keys</h3>
          <span className="text-xs text-[var(--text-secondary)] font-medium">{keys.length} key{keys.length !== 1 ? 's' : ''}</span>
        </div>

        {error && (
          <div className="p-6 text-sm text-[var(--danger)] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!loading && !error && keys.length === 0 && (
          <div className="p-12 text-center">
            <Key className="w-8 h-8 text-[var(--text-secondary)] opacity-30 mx-auto mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)]">No active API keys</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Create a key above to start integrating.</p>
          </div>
        )}

        {keys.length > 0 && (
          <div className="divide-y divide-[var(--border-primary)]">
            {keys.map(key => (
              <div key={key.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-secondary)] transition-colors group">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{key.name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full border border-[var(--success)]/20 shrink-0">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] font-mono">
                    <span>{key.key_prefix}{'•'.repeat(12)}</span>
                    <span className="font-sans">Created {new Date(key.created_at).toLocaleDateString()}</span>
                    {key.last_used_at && (
                      <span className="font-sans">Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                    )}
                    {!key.last_used_at && (
                      <span className="font-sans opacity-50">Never used</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-4">
                  {confirmRevoke === key.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--danger)] font-bold">Revoke?</span>
                      <button
                        onClick={() => handleRevoke(key.id)}
                        disabled={revoking === key.id}
                        className="px-3 py-1.5 bg-[var(--danger)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {revoking === key.id ? 'Revoking…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmRevoke(null)}
                        className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-[var(--accent)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRevoke(key.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-secondary)] border border-transparent rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-[var(--danger)] hover:border-[var(--danger)]/30 hover:bg-[var(--danger)]/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Docs hint */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-[var(--accent)]/10 shrink-0">
          <Key className="w-4 h-4 text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Using your API key</p>
          <p className="text-xs text-[var(--text-secondary)] font-medium mb-3">
            Pass the key as a Bearer token in the Authorization header.
          </p>
          <code className="block text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-secondary)]">
            Authorization: Bearer factti_your_key_here
          </code>
        </div>
      </div>
    </div>
  );
}
