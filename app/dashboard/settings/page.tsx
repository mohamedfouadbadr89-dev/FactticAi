import React from "react";

export default function SettingsPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">

      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Governance Settings
      </h1>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Engine Configuration */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Engine Configuration</h3>
            <p className="text-xs text-gray-400 mt-0.5">Deterministic processing parameters</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Governance Mode</span><p className="text-xs text-gray-400 mt-0.5">Active enforcement level</p></div>
              <span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Active</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Risk Threshold</span><p className="text-xs text-gray-400 mt-0.5">Escalation trigger point</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">0.85</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">RCA Confidence Min</span><p className="text-xs text-gray-400 mt-0.5">Minimum resolution confidence</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">90%</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Drift Alert Threshold</span><p className="text-xs text-gray-400 mt-0.5">Behavioral deviation cap</p></div>
              <span className="text-sm font-mono font-bold text-amber-600">3.0%</span>
            </div>
          </div>
        </div>

        {/* Security & Compliance */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Security & Compliance</h3>
            <p className="text-xs text-gray-400 mt-0.5">System integrity controls</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">RBAC Enforcement</span><p className="text-xs text-gray-400 mt-0.5">Role-based access control</p></div>
              <span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Enabled</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Tamper Detection</span><p className="text-xs text-gray-400 mt-0.5">Integrity verification layer</p></div>
              <span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Sealed</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">PII Redaction</span><p className="text-xs text-gray-400 mt-0.5">Data masking pipeline</p></div>
              <span className="bg-emerald-100 text-emerald-600 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">Active</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Encryption Standard</span><p className="text-xs text-gray-400 mt-0.5">Data at rest / in transit</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">AES-256</span>
            </div>
          </div>
        </div>

        {/* Data Residency */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Data Residency</h3>
            <p className="text-xs text-gray-400 mt-0.5">Regional storage configuration</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Primary Region</span><p className="text-xs text-gray-400 mt-0.5">Production data center</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">US-East-1</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Backup Region</span><p className="text-xs text-gray-400 mt-0.5">Disaster recovery</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">EU-West-1</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Retention Policy</span><p className="text-xs text-gray-400 mt-0.5">Log data lifecycle</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">90 days</span>
            </div>
          </div>
        </div>

        {/* System Version */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 animate-[fadeIn_.4s_ease-in-out]">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">System Information</h3>
            <p className="text-xs text-gray-400 mt-0.5">Build and deployment status</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Engine Version</span><p className="text-xs text-gray-400 mt-0.5">Governance core</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">v1.0.0</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Schema Version</span><p className="text-xs text-gray-400 mt-0.5">Database freeze</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">Core v1.0</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Uptime SLA</span><p className="text-xs text-gray-400 mt-0.5">30-day rolling</p></div>
              <span className="text-sm font-mono font-bold text-emerald-600">99.99%</span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <div><span className="text-sm font-medium text-slate-700">Last Deploy</span><p className="text-xs text-gray-400 mt-0.5">Production release</p></div>
              <span className="text-sm font-mono font-bold text-slate-900">Feb 26, 2026</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
