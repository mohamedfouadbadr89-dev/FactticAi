"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { CountUp } from "@/components/ui/CountUp";
import { AuditModeOverlay } from "@/components/ui/AuditModeOverlay";
import { useSimulationState, useSimulationActions } from "@/lib/dashboard/SimulationContext";
import GlobalSearch from "@/components/ui/GlobalSearch";
import { useInteractionMode } from "@/store/interactionMode";
import { Menu, Compass } from "lucide-react";
import AgentSwitcher from "@/components/dashboard/AgentSwitcher";
import OnboardingTour from "@/components/ui/OnboardingTour";

export default function EnterpriseTopbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { mode: channel, setMode: setChannel } = useInteractionMode();
  const [mode, setMode] = useState<"executive" | "advanced">("executive");
  const [auditMode, setAuditMode] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const { startSimulation, resetSimulation } = useSimulationActions();
  const { isSimulating, simulationStep } = useSimulationState();

  useEffect(() => {
    const saved = localStorage.getItem("facttic_audit_mode");
    if (saved === "true") setAuditMode(true);
  }, []);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const score =
          data?.governance?.governance_score ??
          data?.health?.governance_score ??
          data?.data?.health?.governance_score;
        if (typeof score === 'number') setHealthScore(score);
        else setHealthScore(100); // default when no data yet
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

  const handleResetDemo = async () => {
    if (!confirm("CRITICAL: This will purge all organizational governance data for the current session. This action is IRREVERSIBLE. Proceed?")) return;
    
    try {
      const res = await fetch("/api/admin/clear-demo-data", { method: "POST" });
      if (res.ok) {
        alert("Demo environment reset successful.");
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Reset failed: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      alert("Network error occurred during reset.");
    }
  };

  return (
    <header className="h-16 bg-[var(--card-bg)] border-b border-[var(--border-primary)] flex items-center px-6 relative z-50">
      {/* Left Section (unchanged) */}
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
        <button
          onClick={() => setTourOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
          title="Take a guided tour of the dashboard"
        >
          <Compass className="w-3.5 h-3.5" />
          Take a tour
        </button>

        <button
          onClick={handleResetDemo}
          className="px-3 py-1.5 bg-red-500/10 border border-red-500/40 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500/20 transition-all"
        >
          Reset Demo
        </button>

        <button
          onClick={toggleAuditMode}
          className="text-xs font-bold uppercase"
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
      <OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </header>
  );
}