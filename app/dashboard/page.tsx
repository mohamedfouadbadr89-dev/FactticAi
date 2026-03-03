"use client";

import ExecutiveHealthCard from "@/components/dashboard/ExecutiveHealthCard";
import DriftTrendCard from "@/components/dashboard/DriftTrendCard";
import ActiveAlertsCard from "@/components/dashboard/ActiveAlertsCard";
import RiskBreakdownCard from "@/components/dashboard/RiskBreakdownCard";
import RecentInvestigationsCard from "@/components/dashboard/RecentInvestigationsCard";
import GovernanceSnapshotCard from "@/components/dashboard/GovernanceSnapshotCard";
import VoiceDriftCard from "@/components/dashboard/VoiceDriftCard";
import IntelligenceDashboard from "@/components/dashboard/IntelligenceDashboard";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import { useDashboardData } from "@/lib/dashboard/useDashboardData";
import React from "react";

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
  const { data, loading, error } = useDashboardData("/api/dashboard/stats");
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
      
      {/* Status Strip */}
      <div className="w-full h-8 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-center text-xs uppercase tracking-wider text-[var(--text-secondary)]">
        <div className="flex items-center gap-6">
          <span>Governance Mode: ACTIVE</span>
          <span>Risk Level: LOW</span>
          <span>System Integrity: VERIFIED</span>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            Executive Overview
          </h1>

          {error && (
            <span className="bg-[var(--danger-bg)] text-[var(--danger)] text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
              ⚠ Fallback Data
            </span>
          )}
        </div>

        <DashboardFilters onFilterChange={setFilters} />

        <ExecutiveHealthCard data={data?.health} />
        <DriftTrendCard initialData={data?.drift} filters={filters} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ActiveAlertsCard data={data?.alerts} />
          <RiskBreakdownCard data={data?.risks} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <VoiceDriftCard data={data?.voice_drift} />
          <GovernanceSnapshotCard />
        </div>

        <IntelligenceDashboard data={data?.intelligence} />

        <RecentInvestigationsCard data={data?.investigations} />

      </div>
    </div>
  );
}