"use client";

import ExecutiveHealthCard from "@/components/dashboard/ExecutiveHealthCard";
import DriftTrendCard from "@/components/dashboard/DriftTrendCard";
import ActiveAlertsCard from "@/components/dashboard/ActiveAlertsCard";
import RiskBreakdownCard from "@/components/dashboard/RiskBreakdownCard";
import RecentInvestigationsCard from "@/components/dashboard/RecentInvestigationsCard";
import GovernanceSnapshotCard from "@/components/dashboard/GovernanceSnapshotCard";
import { useDashboardData } from "@/lib/dashboard/useDashboardData";

/* ─── Loading Skeleton (minimal, matches card structure) ─── */
function Skeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
      <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
      <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-56 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-56 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData();

  if (loading) return <Skeleton />;

  return (
    <>
      {/* Status Strip */}
      <div className="w-full h-7 bg-gray-100 border-b border-gray-200 flex items-center justify-center">
        <div className="flex items-center gap-6 text-xs uppercase tracking-wider text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Governance Mode: <span className="text-gray-700 font-medium">ACTIVE</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />Risk Level: <span className="text-gray-700 font-medium">LOW</span></span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400" />System Integrity: <span className="text-gray-700 font-medium">VERIFIED</span></span>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Executive Overview
          </h1>
          {error && (
            <span className="bg-red-50 text-red-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
              ⚠ Fallback Data
            </span>
          )}
        </div>

        <ExecutiveHealthCard data={data?.health} />

        <DriftTrendCard data={data?.drift} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ActiveAlertsCard data={data?.alerts} />
          <RiskBreakdownCard data={data?.risks} />
        </div>

        <RecentInvestigationsCard data={data?.investigations} />

        <GovernanceSnapshotCard />
        
        {/* Dashboard Footer */}
        <footer className="dash-footer border-t border-gray-200 pt-8 mt-12 flex justify-between items-center text-[10px] font-mono tracking-tight text-gray-400">
          <div className="flex items-center gap-4">
            <span>Facttic.AI © 2026 · All Rights Reserved</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>v1.0.4-PROD</span>
            <span className="text-gray-300">•</span>
            <span>Latency: 42ms</span>
            <span className="text-gray-300">•</span>
            <span>Uptime: 99.99%</span>
          </div>
        </footer>

      </div>
    </>
  );
}