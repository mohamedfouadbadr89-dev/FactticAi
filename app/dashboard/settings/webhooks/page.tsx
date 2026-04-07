'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Webhook, Plus, Trash2, Copy, Check, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
}

interface CreatedWebhook extends WebhookEndpoint {
  secret: string;
}

const ALL_EVENTS = [
  { id: '*', label: 'All Events', desc: 'Every governance alert' },
  { id: 'RISK_BLOCK', label: 'Risk Block', desc: 'Decision = BLOCK' },
  { id: 'RISK_WARN', label: 'Risk Warn', desc: 'Decision = WARN' },
  { id: 'POLICY_VIOLATION', label: 'Policy Violation', desc: 'Policy rule triggered' },
  { id: 'DRIFT_DETECTED', label: 'Drift Detected', desc: 'Behavioral drift' },
  { id: 'HALLUCINATION_DETECTED', label: 'Hallucination', desc: 'Hallucination signal' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['*']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedWebhook | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Revoke
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/webhooks');
      if (!res.ok) throw new Error('Failed to load webhooks');
      const data = await res.json();
      setWebhooks(data.webhooks ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const toggleEvent = (id: string) => {
    if (id === '*') {
      setSelectedEvents(['*']);
      return;
    }
    setSelectedEvents(prev => {
      const without = prev.filter(e => e !== '*');
      return without.includes(id) ? without.filter(e => e !== id) : [...without, id];
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), events: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create webhook');
      setCreated(data.webhook);
      setName('');
      setUrl('');
      setSelectedEvents(['*']);
      fetchWebhooks();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setWebhooks(prev => prev.filter(w => w.id !== id));
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const copySecret = async () => {
    if (!created?.secret) return;
    await navigator.clipboard.writeText(created.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Webhook Endpoints</h2>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            Receive real-time governance events on your own infrastructure.
          </p>
        </div>
        <button
          onClick={fetchWebhooks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs font-bold uppercase tracking-widest hover:border-[var(--accent)] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Secret reveal */}
      {created && (
        <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent-bg)] p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Webhook className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-black uppercase tracking-widest text-[var(--accent)]">
                  Webhook Created — Save Secret Now
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Use this to verify <code className="font-mono">X-Facttic-Signature</code> headers. <strong>Never shown again.</strong>
              </p>
            </div>
            <button onClick={() => setCreated(null)} className="text-[var(--text-secondary)] text-xs font-bold uppercase hover:text-[var(--text-primary)]">
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4">
            <code className="flex-1 text-xs font-mono text-[var(--text-primary)] break-all select-all">{created.secret}</code>
            <button
              onClick={copySecret}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${
                copiedSecret
                  ? 'bg-[var(--success)]/20 text-[var(--success)] border border-[var(--success)]/30'
                  : 'bg-[var(--accent)] text-white hover:opacity-90'
              }`}
            >
              {copiedSecret ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSecret ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--warning)] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Endpoint: {created.name} · {created.url}
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="card p-6 space-y-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">
          Register New Endpoint
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. production-alerts"
                maxLength={64}
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">URL (HTTPS)</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://your-server.com/hooks/facttic"
                className="w-full px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          {/* Event filter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Events to Receive</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map(ev => {
                const active = selectedEvents.includes(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => toggleEvent(ev.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                      active
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                    }`}
                    title={ev.desc}
                  >
                    <Zap className="w-3 h-3" />
                    {ev.label}
                  </button>
                );
              })}
            </div>
          </div>

          {createError && (
            <p className="text-xs font-bold text-[var(--danger)] flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={creating || !name.trim() || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Creating…' : 'Register Endpoint'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="card-header border-b border-[var(--border-primary)]">
          <h3 className="card-title">Active Endpoints</h3>
          <span className="text-xs text-[var(--text-secondary)] font-medium">{webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''}</span>
        </div>

        {error && (
          <div className="p-6 text-sm text-[var(--danger)] font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />{error}
          </div>
        )}

        {!loading && !error && webhooks.length === 0 && (
          <div className="p-12 text-center">
            <Webhook className="w-8 h-8 text-[var(--text-secondary)] opacity-30 mx-auto mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)]">No endpoints registered</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Add one above to start receiving governance events.</p>
          </div>
        )}

        {webhooks.length > 0 && (
          <div className="divide-y divide-[var(--border-primary)]">
            {webhooks.map(wh => (
              <div key={wh.id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-secondary)] transition-colors group">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{wh.name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-full border border-[var(--success)]/20 shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[var(--text-secondary)] truncate max-w-md">{wh.url}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                    <span>Events: {wh.events?.join(', ') || '*'}</span>
                    <span>·</span>
                    <span>Created {new Date(wh.created_at).toLocaleDateString()}</span>
                    {wh.last_triggered_at
                      ? <><span>·</span><span>Last fired {new Date(wh.last_triggered_at).toLocaleDateString()}</span></>
                      : <><span>·</span><span className="opacity-50">Never fired</span></>
                    }
                  </div>
                </div>

                <div className="shrink-0 ml-4">
                  {confirmDelete === wh.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--danger)] font-bold">Delete?</span>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        disabled={deleting === wh.id}
                        className="px-3 py-1.5 bg-[var(--danger)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                      >
                        {deleting === wh.id ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-[var(--accent)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(wh.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-secondary)] border border-transparent rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-[var(--danger)] hover:border-[var(--danger)]/30 hover:bg-[var(--danger)]/5 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification docs */}
      <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Webhook className="w-4 h-4 text-[var(--accent)]" />
          <p className="text-sm font-bold text-[var(--text-primary)]">Verifying Webhook Signatures</p>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Each request includes <code className="font-mono">X-Facttic-Signature</code> and <code className="font-mono">X-Facttic-Timestamp</code>. Verify using HMAC-SHA256:
        </p>
        <code className="block text-xs font-mono bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 text-[var(--text-secondary)] whitespace-pre">{`const sig = createHmac('sha256', secret)
  .update(\`\${timestamp}.\${rawBody}\`)
  .digest('hex');
const valid = sig === req.headers['x-facttic-signature'].slice(7);`}</code>
      </div>
    </div>
  );
}
