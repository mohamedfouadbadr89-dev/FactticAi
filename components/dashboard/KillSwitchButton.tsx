"use client";

import { useCallback, useEffect, useState } from "react";
import { Power, X, AlertTriangle } from "lucide-react";

interface KillSwitchState {
  enabled: boolean;
  reason: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

/**
 * KillSwitchButton
 *
 * Topbar control that shows the live kill-switch state for the current org
 * and toggles it via /api/governance/kill-switch. When ON, the governance
 * pipeline short-circuits to ALLOW for every request — an emergency bypass
 * for when your own policies are causing false positives in production.
 */
export default function KillSwitchButton() {
  const [state, setState] = useState<KillSwitchState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/governance/kill-switch", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as KillSwitchState;
        setState(data);
      } else {
        setState({ enabled: false, reason: null, updated_at: null, updated_by: null });
      }
    } catch {
      setState({ enabled: false, reason: null, updated_at: null, updated_by: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    // Re-poll every 30s so the UI reflects toggles made from other tabs/devices
    const interval = setInterval(fetchState, 30_000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const openModal = () => {
    setReasonDraft(state?.reason ?? "");
    setError(null);
    setModalOpen(true);
  };

  const submit = async (nextEnabled: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/governance/kill-switch", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: nextEnabled,
          reason: nextEnabled ? reasonDraft || null : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP_${res.status}`);
      }
      const data = (await res.json()) as KillSwitchState;
      setState(data);
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Toggle failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div
        className="px-3 py-1.5 border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest rounded-lg opacity-40"
        aria-label="Loading kill switch state"
      >
        <Power className="w-3.5 h-3.5 inline-block" />
      </div>
    );
  }

  const enabled = !!state?.enabled;

  return (
    <>
      <button
        onClick={openModal}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
          enabled
            ? "bg-amber-500/15 border border-amber-500/60 text-amber-400 hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            : "bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]"
        }`}
        title={enabled ? "Governance bypass is ACTIVE — click to disable" : "Governance enforcement is live — click to bypass"}
      >
        <Power className="w-3.5 h-3.5" />
        {enabled ? "Bypass: ON" : "Kill Switch"}
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={() => !busy && setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-3xl shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !busy && setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">
              <AlertTriangle className="w-4 h-4" />
              Emergency Control
            </div>
            <h2 className="text-xl font-black tracking-tight uppercase mb-2">
              Governance Kill Switch
            </h2>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed mb-5">
              {enabled
                ? "Bypass is currently ACTIVE. Every request is passing through with ALLOW and no enforcement. Turn this off to resume normal governance."
                : "Enabling bypass will short-circuit the governance pipeline for this org — every request returns ALLOW with zero enforcement. Use only when your policies are blocking legitimate traffic."}
            </p>

            {!enabled && (
              <label className="block mb-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                  Reason (optional)
                </span>
                <textarea
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  placeholder="e.g. incident #482 — PII analyzer flagging valid transcripts"
                  className="mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] resize-none"
                  rows={2}
                  maxLength={500}
                  disabled={busy}
                />
              </label>
            )}

            {state?.reason && enabled && (
              <div className="mb-5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1">
                  Current reason
                </div>
                <div className="text-[12px] text-[var(--text-primary)]">{state.reason}</div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 text-[11px] font-medium">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                disabled={busy}
                className="px-4 py-2 border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[var(--bg-primary)] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => submit(!enabled)}
                disabled={busy}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-40 ${
                  enabled
                    ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                    : "bg-amber-500 text-black hover:bg-amber-400"
                }`}
              >
                {busy ? "…" : enabled ? "Resume Enforcement" : "Engage Bypass"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
