"use client";

import React from "react";
import ReportBuilder from "@/src/reporting/ReportBuilder";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 md:p-10 space-y-10 animate-[fadeIn_.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--border-color)] pb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white to-[var(--text-secondary)] bg-clip-text text-transparent">
            Governance Reports
          </h1>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl leading-relaxed">
            Generate deterministic governance intelligence reports. Configure your metrics, date range, and format to export mission-critical analytics.
          </p>
        </div>
        <div className="p-4 bg-[var(--accent-soft)] rounded-2xl border border-[var(--accent)]/20">
          <FileText className="w-8 h-8 text-[var(--accent)]" />
        </div>
      </div>

      <div className="animate-[fadeIn_.4s_ease-out]">
        <ReportBuilder />
      </div>
    </div>
  );
}
