"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { CountUp } from "@/components/ui/CountUp";
import { AuditModeOverlay } from "@/components/ui/AuditModeOverlay";
import { useSimulation } from "@/lib/dashboard/SimulationContext";
import GlobalSearch from "@/components/ui/GlobalSearch";
import { useInteractionMode } from "@/store/interactionMode";
import { Menu, RefreshCw, AlertTriangle } from "lucide-react";
import AgentSwitcher from "@/components/dashboard/AgentSwitcher";
import { supabase } from "@/lib/supabase";

export default function EnterpriseTopbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { mode: channel, setMode: setChannel } = useInteractionMode();
  const [mode, setMode] = useState<"executive" | "advanced">("executive");
  const [auditMode, setAuditMode] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const { isSimulating, simulationStep, startSimulation, resetSimulation } = useSimulation();

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase
        .from('org_members')
        .select('role')
        .eq('user_id', user.id)
        .single();
      setRole(member?.role || null);
    }
    checkRole();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("facttic_audit_mode");
    if (saved === "true") setAuditMode(true);
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const score = data?.health?.governance_score ?? data?.data?.health?.governance_score;
        if (typeof score === 'number') setHealthScore(score);
      })
      .catch(() => {});
  }, []);

  const toggleAuditMode = () => {
    const next = !auditMode;
    setAuditMode(next);
    localStorage.setItem("facttic_audit_mode", String(next));
  };

  const router = useRouter();

  // Temporary Logout (Auth Disabled)
  const handleLogout = () => {
    console.log("Auth disabled — mock logout");
    router.push("/");
  };

  return (
    <header className="h-16 bg-[var(--card-bg)] border-b border-[var(--border-primary)] flex items-center px-6 relative z-50">

      {/* Left Section */}
      <div className="flex items-center gap-3">
        
        <button 
          onClick={onToggleSidebar}
          className="md:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-lg transition-colors focus:ring-2 focus:ring-[var(--accent)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AgentSwitcher />

        <div className="h-6 w-px bg-[var(--bg-primary)] mx-3" />

        <div className="hidden sm:flex bg-[var(--bg-primary)] rounded-xl p-1 gap-1">
          <button
            onClick={() => setChannel("chat")}
            className={`px-5 py-2 text-sm font-medium rounded-lg ${
              channel === "chat"
                ? "bg-[var(--card-bg)] text-[var(--accent)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setChannel("voice")}
            className={`px-5 py-2 text-sm font-medium rounded-lg ${
              channel === "voice"
                ? "bg-[var(--card-bg)] text-[var(--accent)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            Voice
          </button>
        </div>

      </div>

      {/* Center Section (Command Palette) */}
      <div className="flex-1 flex justify-center items-center px-4">
        <GlobalSearch />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">

        {(
          <button
            disabled={clearing}
            onClick={async () => {
              if (confirm("Reset all demo data? This cannot be undone.")) {
                setClearing(true);
                try {
                  const res = await fetch('/api/admin/clear-demo-data', { method: 'POST' });
                  if (res.ok) window.location.reload();
                } catch (e) { console.error(e); }
                finally { setClearing(false); }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
          >
            {clearing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
            Reset Demo
          </button>
        )}

        <button
          onClick={toggleAuditMode}
          className="text-xs font-bold uppercase transition-all hover:text-[var(--accent)]"
        >
          {auditMode ? "Audit: ON" : "Audit Mode"}
        </button>

        <ThemeToggle />

        <div className="hidden lg:block px-4 py-1.5 rounded-lg border border-[var(--border-primary)] text-center min-w-[100px]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
            Health
          </span>
          <div className="text-lg font-bold">
            {healthScore != null ? <CountUp value={healthScore} /> : '--'}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-xs font-bold uppercase border rounded-lg"
        >
          Sign Out
        </button>

      </div>

      <AuditModeOverlay isOpen={auditMode} onClose={toggleAuditMode} />
    </header>
  );
}