"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAgent, Agent } from "@/lib/dashboard/AgentContext";
import { ChevronDown, Bot, Mic, MessageSquare, Plus, RefreshCw } from "lucide-react";

export default function AgentSwitcher() {
  const { agents, selectedAgent, setSelectedAgent, loading, refetch } = useAgent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const TypeIcon = ({ type, size = 11 }: { type: "chat" | "voice"; size?: number }) =>
    type === "voice"
      ? <Mic style={{ width: size, height: size }} />
      : <MessageSquare style={{ width: size, height: size }} />;

  // No agents yet — link to AI Providers page
  if (!loading && agents.length === 0) {
    return (
      <Link
        href="/dashboard/agents"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed transition-colors"
        style={{ borderColor: "var(--border-primary)", color: "var(--text-muted)" }}
        title="Connect your first AI agent"
      >
        <Plus style={{ width: 12, height: 12 }} />
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
          Connect Agent
        </span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
        style={{
          background: "var(--bg-primary)",
          borderColor: open ? "var(--accent)" : "var(--border-primary)",
          color: "var(--text-primary)",
          minWidth: 180,
        }}
      >
        {/* Status dot */}
        <span
          style={{
            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
            background: selectedAgent?.is_active ? "#22c55e" : "#6b7280",
          }}
        />

        {/* Agent name */}
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {loading ? "Loading…" : (selectedAgent?.name ?? "Select Agent")}
        </span>

        {/* Type badge */}
        {selectedAgent && (
          <span
            style={{
              fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "2px 6px", borderRadius: 4,
              background: selectedAgent.type === "voice" ? "rgba(139,92,246,0.15)" : "rgba(59,130,246,0.15)",
              color: selectedAgent.type === "voice" ? "#a78bfa" : "#60a5fa",
              display: "flex", alignItems: "center", gap: 3, flexShrink: 0,
            }}
          >
            <TypeIcon type={selectedAgent.type} />
            {selectedAgent.type}
          </span>
        )}

        <ChevronDown
          style={{
            width: 13, height: 13, color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s", flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 rounded-xl border shadow-2xl z-[100] overflow-hidden"
          style={{
            background: "var(--card-bg)",
            borderColor: "var(--border-primary)",
            minWidth: 260,
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              Active Agents — {agents.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); refetch(); }}
              className="p-1 rounded hover:bg-[var(--bg-primary)] transition-colors"
              title="Refresh agents"
            >
              <RefreshCw style={{ width: 11, height: 11, color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Agent list */}
          <div className="py-1" style={{ maxHeight: 320, overflowY: "auto" }}>
            {agents.map(agent => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => { setSelectedAgent(agent); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
                  style={{
                    background: isSelected ? "var(--bg-primary)" : "transparent",
                    borderLeft: isSelected ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--bg-primary)"; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Icon */}
                  <div
                    className="rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 32, height: 32,
                      background: agent.type === "voice" ? "rgba(139,92,246,0.12)" : "rgba(59,130,246,0.12)",
                      color: agent.type === "voice" ? "#a78bfa" : "#60a5fa",
                    }}
                  >
                    <TypeIcon type={agent.type} size={14} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {agent.name}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: 7, fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", flexShrink: 0 }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        v{agent.version}
                      </span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)", flexShrink: 0 }} />
                      <span style={{
                        fontSize: 8, fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: agent.type === "voice" ? "#a78bfa" : "#60a5fa",
                      }}>
                        {agent.type}
                      </span>
                    </div>
                  </div>

                  {/* Status dot */}
                  <span
                    style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: agent.is_active ? "#22c55e" : "#6b7280",
                    }}
                    title={agent.is_active ? "Active" : "Inactive"}
                  />
                </button>
              );
            })}
          </div>

          {/* Footer — connect + manage */}
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border-primary)" }}>
            <a
              href="/dashboard/connect"
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", fontWeight: 700 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              onClick={() => setOpen(false)}
            >
              <Plus style={{ width: 11, height: 11 }} />
              Connect Agent
            </a>
            <a
              href="/dashboard/connect"
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}
              onClick={() => setOpen(false)}
            >
              Manage All →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
