"use client";

import { useRouter } from "next/navigation";
import ExecutiveHealthCard from "@/components/dashboard/ExecutiveHealthCard";
import DriftTrendCard from "@/components/dashboard/DriftTrendCard";
import ActiveAlertsCard from "@/components/dashboard/ActiveAlertsCard";
import RiskBreakdownCard from "@/components/dashboard/RiskBreakdownCard";
import RecentInvestigationsCard from "@/components/dashboard/RecentInvestigationsCard";
import GovernanceSnapshotCard from "@/components/dashboard/GovernanceSnapshotCard";
import GovernanceStateCard from "@/components/dashboard/GovernanceStateCard";
import VoiceDriftCard from "@/components/dashboard/VoiceDriftCard";
import IntelligenceDashboard from "@/components/dashboard/IntelligenceDashboard";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useDashboardData } from "@/lib/dashboard/useDashboardData";
import React from "react";
import { useInteractionMode } from "@/store/interactionMode";

import { Skeleton } from "@/components/ui/Skeleton";
import { CardSkeleton } from "@/components/ui/CardSkeleton";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

function DashboardLoadingSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
      <Skeleton height="36px" width="280px" />
      <CardSkeleton className="min-h-[220px]" />
      <ChartSkeleton className="min-h-[300px]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardSkeleton className="min-h-[260px]" />
        <CardSkeleton className="min-h-[260px]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardSkeleton className="min-h-[260px]" />
        <CardSkeleton className="min-h-[260px]" />
      </div>
      <TableSkeleton rows={5} className="min-h-[340px]" />
      <CardSkeleton className="min-h-[280px]" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, error } = useDashboardData("/api/dashboard/stats");
  const { mode: channel } = useInteractionMode();

  const [filters, setFilters] = React.useState({
    startDate: "",
    endDate: "",
    modelVersion: "all",
    channels: ["chat", "voice"]
  });

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Governance Status Bar */}
      <div className="w-full h-8 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-center text-xs uppercase tracking-wider text-[var(--text-secondary)]">
        <div className="flex items-center gap-6">
          <span>Governance Mode: ACTIVE</span>
          <span>
            Risk Level:{" "}
            <span className={Number(data?.health?.avg_risk_24h) > 50 ? "text-[var(--danger)]" : Number(data?.health?.avg_risk_24h) > 20 ? "text-[var(--warning)]" : "text-[var(--success)]"}>
              {data?.health ? (Number(data.health.avg_risk_24h) > 50 ? "HIGH" : Number(data.health.avg_risk_24h) > 20 ? "MEDIUM" : "LOW") : "—"}
            </span>
          </span>
          <span>
            System Integrity:{" "}
            <span className={data?.health?.tamper_integrity === "Warning" ? "text-[var(--danger)]" : data?.health?.tamper_integrity === "Verified" ? "text-[var(--success)]" : "text-[var(--text-secondary)]"}>
              {data?.health?.tamper_integrity ?? "—"}
            </span>
          </span>
        </div>
      </div>

      {/* Voice Mode — empty state banner */}
      {channel === "voice" && (
        <div className="max-w-[1400px] mx-auto px-8 pt-10">
          <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">No Voice Sessions Yet</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-md">
              Voice governance data will appear here once you connect a voice provider and run your first session.
              Switch to <strong>Chat</strong> to see your current governance data.
            </p>
            <a href="/dashboard/connect" className="mt-2 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">
              Connect Voice Provider →
            </a>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className={`max-w-[1400px] mx-auto px-8 py-10 space-y-10 ${channel === "voice" ? "opacity-20 pointer-events-none select-none" : ""}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            Executive Risk Overview
          </h1>

          <div className="flex items-center gap-4">
            {error && (
              <span className="bg-[var(--danger-bg)] text-[var(--danger)] text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                ⚠ Fallback Data
              </span>
            )}
            <button onClick={() => router.push('/dashboard/governance')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Governance →</button>
            <button onClick={() => router.push('/dashboard/alerts')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Alerts →</button>
            <button onClick={() => router.push('/dashboard/reports')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Reports →</button>
            <button onClick={() => router.push('/dashboard/compliance')} className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">Compliance →</button>
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters onFilterChange={setFilters} />

        {/* Executive Health */}
        <ExecutiveHealthCard data={data?.health} />

        {/* Drift Monitoring */}
        <DriftTrendCard initialData={data?.drift} filters={filters} />

        {/* Alerts + Risk + Governance State */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ActiveAlertsCard data={data?.alerts} />
          <RiskBreakdownCard data={data?.risks} />
          <GovernanceStateCard />
        </div>

        {/* Voice Drift + Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <VoiceDriftCard data={data?.voice_drift} />
          <IntelligenceDashboard data={data?.intelligence} />
        </div>

        {/* Governance Snapshot + Recent Investigations */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <GovernanceSnapshotCard stats={data as any} />
          </div>
          <div className="lg:col-span-2">
            <RecentInvestigationsCard data={(data as any)?.investigations?.recent} />
          </div>
        </div>

      </div>
    </div>
  );
}