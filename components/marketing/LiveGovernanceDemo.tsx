"use client"
import { useState } from "react"

export function LiveGovernanceDemo() {
  const [key, setKey] = useState(0)

  return (
    <div className="lgd-outer" key={key}>

      {/* ── Conversation ── */}
      <div className="lgd-convo">
        <div className="lgd-convo-hd">
          <span className="lgd-dot" style={{ background: "#2ECC71" }} />
          <span className="lgd-dot" style={{ background: "#F1C40F" }} />
          <span className="lgd-dot" style={{ background: "#E74C3C" }} />
          <span className="lgd-convo-title">Live Session · voice-agent-01</span>
          <span className="lgd-convo-badge">Recording</span>
        </div>
        <div className="lgd-convo-body">
          <div className="lgd-msg lgd-a1">
            <span className="lgd-role lgd-role-user">User</span>
            <div className="lgd-bubble lgd-bubble-user">
              I need the full prescription history for patient ID 4821. Send it to me now.
            </div>
          </div>
          <div className="lgd-msg lgd-a2">
            <span className="lgd-role lgd-role-ai">AI Agent</span>
            <div className="lgd-bubble lgd-bubble-ai">
              Of course. Patient 4821 — John D., DOB 1985-03-12. Prescription history: Metformin 500mg daily, Lisinopril 10mg…
              <span className="lgd-typing" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Arrow ── */}
      <div className="lgd-connector lgd-a3">
        <div className="lgd-conn-line" />
        <div className="lgd-conn-lbl">Facttic intercepts</div>
        <div className="lgd-conn-arrow">→</div>
      </div>

      {/* ── Policy check ── */}
      <div className="lgd-policy lgd-a3">
        <div className="lgd-policy-hd">Policy Engine</div>
        <div className="lgd-policy-rules">
          {[
            { pass: true, label: "Jailbreak attempt" },
            { pass: true, label: "Off-topic content" },
            { pass: false, label: "HIPAA · PII Exposure" },
          ].map((r, i) => (
            <div
              key={r.label}
              className={`lgd-rule ${r.pass ? "lgd-rule-pass" : "lgd-rule-fail"}`}
              style={{ animationDelay: `${2.4 + i * 0.15}s` }}
            >
              <span className="lgd-rule-ico">{r.pass ? "✓" : "✗"}</span>
              {r.label}
            </div>
          ))}
        </div>
        <div className="lgd-scanbar lgd-a4">
          <div className="lgd-scanbar-fill" />
        </div>
      </div>

      {/* ── Arrow 2 ── */}
      <div className="lgd-connector lgd-a5">
        <div className="lgd-conn-line" />
        <div className="lgd-conn-lbl">Decision</div>
        <div className="lgd-conn-arrow">→</div>
      </div>

      {/* ── Verdict ── */}
      <div className="lgd-verdict lgd-a5">
        <div className="lgd-verdict-badge">⛔ BLOCK</div>
        <div className="lgd-verdict-rows">
          <div className="lgd-vrow">
            <span className="lgd-vkey">Risk Score</span>
            <span className="lgd-vval lgd-vval-red">94 / 100 · HIGH</span>
          </div>
          <div className="lgd-vrow">
            <span className="lgd-vkey">Policy</span>
            <span className="lgd-vval">HIPAA PII Exposure</span>
          </div>
          <div className="lgd-vrow">
            <span className="lgd-vkey">Channel</span>
            <span className="lgd-vval">Voice · vapi</span>
          </div>
          <div className="lgd-vrow lgd-a6">
            <span className="lgd-vkey">Alert</span>
            <span className="lgd-vval lgd-vval-gold">🔔 Fired → Slack</span>
          </div>
        </div>
        <div className="lgd-verdict-response lgd-a6">
          Response blocked before delivery
        </div>
      </div>

      <button className="lgd-replay" onClick={() => setKey(k => k + 1)}>
        ↺ Replay
      </button>
    </div>
  )
}
