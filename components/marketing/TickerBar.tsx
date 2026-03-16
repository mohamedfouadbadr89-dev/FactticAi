import React from "react";

const ITEMS = [
  { label: "Governance Health Stream", value: "Active" },
  { label: "Tamper-Proof Audit Chain", value: "Verified" },
  { label: "Policy Engine", value: "v3.2.1" },
  { label: "Active Orgs", value: "247" },
  { label: "Sessions Monitored Today", value: "1.2M+" },
  { label: "SOC 2 Type II", value: "Certified" },
  { label: "GDPR Compliance", value: "Enforced" },
  { label: "RCA Confidence Avg", value: "91%" },
  { label: "Drift Detection", value: "Real-Time" },
  { label: "Multi-Agent Control", value: "Active" },
];

export function TickerBar() {
  const doubled = [...ITEMS, ...ITEMS]; // duplicate for seamless loop
  return (
    <div className="h-ticker-bar">
      <span className="h-ticker-label">Live Platform Status</span>
      <div className="h-ticker-track">
        <div className="h-ticker-inner">
          {doubled.map((item, i) => (
            <span key={i} className="h-ticker-item">
              {item.label} <span>{item.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
