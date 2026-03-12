"use client";

import React, { useState } from "react";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import EvaluationAnalysis from "@/components/dashboard/EvaluationAnalysis";
import AdvancedAnalytics from "@/components/dashboard/AdvancedAnalytics";
import ReportBuilder from "@/components/dashboard/ReportBuilder";
import AlertConfiguration from "@/components/dashboard/AlertConfiguration";
import { BarChart3, FileText, BellRing, Search, LayoutGrid } from "lucide-react";

/**
 * Custom Tab Component for Intelligence Page
 */
const CustomTabs = ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (id: string) => void }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'analysis', label: 'Evaluation Analysis', icon: Search },
    { id: 'alerts', label: 'Alert Guardrails', icon: BellRing },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl w-fit mb-8 shadow-inner">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              isActive 
                ? 'bg-[var(--accent)] text-white shadow-[0_4px_20px_rgba(var(--accent-rgb),0.3)] scale-[1.02]' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    modelVersion: "all",
    channels: ["chat", "voice"]
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-10 space-y-10 animate-[fadeIn_.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-color)] pb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-[var(--text-secondary)] bg-clip-text text-transparent">
            Governance Intelligence
          </h1>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl leading-relaxed">
            A centralized, deterministic mission control for proactive governance. Monitor behavioral drift, 
            configure alerting guardrails, and generate executive-ready intelligence.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1">Global Context Filters</label>
        <DashboardFilters onFilterChange={setFilters} />
      </div>

      <CustomTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="relative min-h-[600px] transition-all duration-500">
        {activeTab === 'overview' && (
          <div className="animate-[fadeIn_.4s_ease-out]">
            <AdvancedAnalytics />
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="animate-[fadeIn_.4s_ease-out] space-y-12">
            <EvaluationAnalysis filters={filters} />
          </div>
        )}


        {activeTab === 'alerts' && (
          <div className="animate-[fadeIn_.4s_ease-out] max-w-4xl mx-auto">
            <AlertConfiguration />
          </div>
        )}
      </div>
    </div>
  );
}
