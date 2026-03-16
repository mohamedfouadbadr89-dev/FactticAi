import React from "react";
import "./home.css";

export default function MarketingPage() {
  return (
    <div className="hp-root">

      {/* ══ TICKER ══ */}
      <div className="hp-ticker">
        <span className="hp-ticker-label">Live Platform Status</span>
        <div className="hp-ticker-track">
          <div className="hp-ticker-inner">
            {[...Array(2)].map((_, r) => (
              <React.Fragment key={r}>
                {[
                  ["Governance Health Stream","Active"],
                  ["Tamper-Proof Audit Chain","Verified"],
                  ["Policy Engine","v3.2.1"],
                  ["Active Orgs","247"],
                  ["Sessions Monitored Today","1.2M+"],
                  ["SOC 2 Type II","Certified"],
                  ["GDPR Compliance","Enforced"],
                  ["RCA Confidence Avg","91%"],
                  ["Drift Detection","Real-Time"],
                  ["Multi-Agent Control","Active"],
                ].map(([label, val]) => (
                  <span key={label+r} className="hp-ticker-item">{label} <span>{val}</span></span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <div className="hp-hero">
        <div className="hp-hero-grid" />
        <div className="hp-hero-scan" />
        <div className="hp-hero-inner">
          <div>
            <div className="hp-hero-label hp-a-fadeup hp-a1">
              <div className="hp-hero-label-dot" />
              Enterprise AI Governance Platform — WF2A Rev 3
            </div>
            <h1 className="hp-hero-title hp-a-fadeup hp-a2">
              <em>Control</em>
              <strong>What Your AI Agents</strong>
              Actually Do.
            </h1>
            <p className="hp-hero-desc hp-a-fadeup hp-a3">
              Facttic is the <strong>first governance-first behavioral control layer</strong> for enterprise AI. Not an observability tool. Not a dashboard. A complete platform that enforces policy, detects drift, proves integrity, and gives executives full visibility — across every agent, channel, and deployment.
            </p>
            <div className="hp-hero-actions hp-a-fadeup hp-a4">
              <button className="hp-btn-primary">Request Enterprise Access</button>
              <button className="hp-btn-ghost">View Platform Architecture →</button>
            </div>
            <div className="hp-trust hp-a-fadeup hp-a5">
              {[
                { icon: "M6 1l1.8 3.6L12 5.3l-3 2.9.7 4.1L6 10.4l-3.7 1.9.7-4.1-3-2.9 4.2-.7z", label: "SOC 2 Type II" },
                { icon: "M4 4V3a2 2 0 1 1 4 0v1M2 4h8v7H2z", label: "GDPR / HIPAA Ready" },
                { icon: "M4 6l1.5 1.5L8 4M6 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z", label: "Tamper-Proof Audit" },
                { icon: "M2 10V5l4-4 4 4v5H7V8H5v2z", label: "Self-Host / VPC" },
              ].map((t, i) => (
                <React.Fragment key={t.label}>
                  {i > 0 && <div className="hp-trust-div" />}
                  <div className="hp-trust-item">
                    <svg viewBox="0 0 12 12" fill="none"><path d={t.icon} stroke="currentColor" strokeWidth="1.2" /></svg>
                    {t.label}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hp-a-fadein hp-a3">
            <div className="hp-dp">
              <div className="hp-dp-topbar">
                <div className="hp-dp-dot" style={{background:"#2ECC71"}} />
                <div className="hp-dp-dot" style={{background:"#F1C40F",marginLeft:4}} />
                <div className="hp-dp-dot" style={{background:"#E74C3C",marginLeft:4}} />
                <div style={{marginLeft:10}}>
                  <div className="hp-dp-orglbl">Active Org</div>
                  <div className="hp-dp-org">Meridian Financial Group</div>
                </div>
                <div className="hp-dp-score">
                  <div>
                    <div className="hp-dp-scorelbl">Gov. Health</div>
                    <div className="hp-dp-scorenum">84</div>
                  </div>
                </div>
                <div className="hp-dp-tamper">
                  <div className="hp-dp-tamper-dot" />
                  <div className="hp-dp-tamper-txt">Tamper-Proof</div>
                </div>
              </div>

              <div className="hp-dp-body">
                <div className="hp-dp-sidebar">
                  <div className="hp-dp-sec">Gov. Core</div>
                  <div className="hp-dp-nav on">
                    <svg viewBox="0 0 10 10" fill="none"><rect x="0.5" y="0.5" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/><rect x="6" y="0.5" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/><rect x="0.5" y="6" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/><rect x="6" y="6" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/></svg>
                    Overview
                  </div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1"/><path d="M5 2.5v3l1.5 1" stroke="currentColor" strokeWidth="1"/></svg>
                    Drift Intel
                  </div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M5 0.5l1.5 3L9.5 4l-2.5 2.5.5 3.5L5 8.5 2.5 10l.5-3.5L0.5 4l3-0.5z" stroke="currentColor" strokeWidth="1"/></svg>
                    Alerts
                  </div>
                  <div className="hp-dp-sec">Security</div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><rect x="1" y="3" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1"/><path d="M3 3V2a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1"/></svg>
                    Audit Log
                  </div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M5 0.5C3 0.5 1.5 1.5 1.5 3v1.5c0 2 1.5 4 3.5 5 2-1 3.5-3 3.5-5V3C8.5 1.5 7 0.5 5 0.5z" stroke="currentColor" strokeWidth="1"/></svg>
                    Integrity
                  </div>
                  <div className="hp-dp-sec">Voice</div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1"/><path d="M3.5 5a1.5 1.5 0 0 0 3 0M5 2v.5M5 7.5V8" stroke="currentColor" strokeWidth="1"/></svg>
                    Live Mon.
                  </div>
                </div>

                <div className="hp-dp-main">
                  <div className="hp-dp-score-row">
                    <div className="hp-dp-big">84</div>
                    <div className="hp-dp-meta">
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val">428</span><span className="hp-dp-sm-lbl">Sessions</span></div>
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val">87</span><span className="hp-dp-sm-lbl">Voice Calls</span></div>
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val" style={{color:"#C9A84C"}}>2.4%</span><span className="hp-dp-sm-lbl">Drift Freq</span></div>
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val" style={{color:"#2ECC71"}}>91%</span><span className="hp-dp-sm-lbl">RCA Conf.</span></div>
                    </div>
                  </div>
                  <div className="hp-dp-chart">
                    <div className="hp-dp-chart-lbl">Drift Trend — 30 Days</div>
                    <svg viewBox="0 0 320 50" preserveAspectRatio="none" style={{width:"100%",height:48}}>
                      <path d="M0,42 L32,36 L64,33 L96,29 L128,27 L160,24 L192,20 L224,17 L256,14 L288,11 L320,8" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5"/>
                      <path d="M0,42 L32,36 L64,33 L96,29 L128,27 L160,24 L192,20 L224,17 L256,14 L288,11 L320,8 L320,50 L0,50 Z" fill="rgba(201,168,76,0.06)"/>
                      <circle cx="96" cy="29" r="3" fill="#E74C3C"/>
                      <circle cx="320" cy="8" r="3.5" fill="#E74C3C"/>
                    </svg>
                  </div>
                  <div className="hp-dp-alerts">
                    {[
                      {col:"#E74C3C",txt:"Behavioral Drift — Customer Advisory Channel",tag:"HIGH",tagCol:"#E74C3C"},
                      {col:"#E74C3C",txt:"Policy Boundary Breach — Voice Channel",tag:"HIGH",tagCol:"#E74C3C"},
                      {col:"#F39C12",txt:"Instruction Set Drift — Support Tier 2",tag:"MED",tagCol:"#F39C12"},
                    ].map((a,i) => (
                      <div key={i} className="hp-dp-alert">
                        <div className="hp-dp-alert-dot" style={{background:a.col}} />
                        <div className="hp-dp-alert-txt">{a.txt}</div>
                        <span style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",fontSize:7,fontWeight:700,color:a.tagCol}}>{a.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hp-dp-watermark">
                <div className="hp-dp-badge">Executive Dashboard · Live View</div>
                <div style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:1}}>Feb 26, 2026 · 09:41 UTC</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ METRICS BAR ══ */}
      <div className="hp-metrics">
        <div className="hp-metrics-inner">
          {[
            {lbl:"Platform Scope",num:"12",sup:"+",desc:"Governance Intelligence Layers"},
            {lbl:"Feature Modules",num:"80",sup:"+",desc:"Enterprise control capabilities"},
            {lbl:"Avg. RCA Confidence",num:"91",sup:"%",desc:"Root cause accuracy across orgs"},
            {lbl:"Tamper Events",num:"0",sup:".",desc:"Cryptographic audit integrity — 30d clean"},
            {lbl:"AI Providers Supported",num:"All",sup:".",desc:"Provider-agnostic governance layer"},
          ].map(m => (
            <div key={m.lbl} className="hp-metric">
              <div className="hp-metric-lbl">{m.lbl}</div>
              <div className="hp-metric-num">{m.num}<span>{m.sup}</span></div>
              <div className="hp-metric-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ WHAT IS FACTTIC ══ */}
      <section className="hp-what hp-section">
        <div className="hp-section-inner">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"start",marginBottom:60}}>
            <div>
              <div className="hp-eyebrow">Product Positioning</div>
              <h2 className="hp-h2">Not a Dashboard.<br /><strong>A Governance <em>Platform.</em></strong></h2>
            </div>
            <div style={{paddingTop:32}}>
              <p className="hp-sub">Every tool in the AI observability category shows you what happened. Facttic controls what is <em>allowed</em> to happen — and proves it, immutably, to regulators, auditors, and boards.</p>
            </div>
          </div>
          <div className="hp-what-grid">
            <div className="hp-notvs">
              <div className="hp-notvs-grid">
                <div className="hp-nvcol">
                  <div className="hp-nvcol-hd no">✗ Facttic is NOT</div>
                  {["An LLM debugging console","An observability dashboard","A developer trace viewer","A startup analytics tool","A purple-gradient SaaS","A single-modal tool"].map(t=>(
                    <div key={t} className="hp-nvitem"><span className="hp-nvico">✗</span>{t}</div>
                  ))}
                </div>
                <div className="hp-nvcol">
                  <div className="hp-nvcol-hd yes">✓ Facttic IS</div>
                  {["A behavioral control layer","A cryptographic audit system","An enterprise governance platform","A compliance evidence generator","Executive + Engineering parity","Chat + Voice + Multi-Agent"].map(t=>(
                    <div key={t} className="hp-nvitem"><span className="hp-nvico" style={{color:"var(--hp-green)"}}>✓</span>{t}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="hp-what-stats">
              {[
                {num:"12",sup:"+",lbl:"Platform Intelligence Layers",desc:"From behavioral drift detection to cryptographic audit chains — every governance layer in one platform."},
                {num:"80",sup:"+",lbl:"Enterprise Control Modules",desc:"RCA engines, hallucination detection, voice governance, compliance exports, multi-agent risk mapping."},
                {num:"2",sup:"×",lbl:"Executive + Advanced Modes",desc:"CFO sees governance scores and risk trends. CTO sees drift indices, prompt hashes, and system telemetry."},
              ].map(s=>(
                <div key={s.lbl} className="hp-wstat">
                  <div className="hp-wstat-num">{s.num}<span>{s.sup}</span></div>
                  <div><div className="hp-wstat-lbl">{s.lbl}</div><div className="hp-wstat-desc">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLATFORM LAYERS ══ */}
      <div className="hp-layers">
        <div className="hp-section-inner">
          <div className="hp-layers-header">
            <div>
              <div className="hp-eyebrow" style={{color:"var(--hp-gold)"}}>Platform Architecture</div>
              <h2 className="hp-layers-h2">Every Intelligence Layer.<br /><strong>One <em>Platform.</em></strong></h2>
            </div>
            <div>
              <p className="hp-layers-sub">Facttic is architected as a modular governance intelligence system. Each layer operates independently but contributes to a unified composite health score — giving you atomic control and systemic awareness simultaneously.</p>
            </div>
          </div>
          <div className="hp-layers-grid">
            {[
              {c:"c1",ico:"⬡",num:"Layer 01",title:"Governance Core & Drift Intelligence",feats:["Model Version Drift Detection","Cross-Session Hallucination Patterns","Silent Regression Detection","Risk Momentum Scoring","Predictive Drift Escalation"],count:9},
              {c:"c2",ico:"🔐",num:"Layer 02",title:"Security & Tamper-Proof Layer",feats:["Cryptographic Audit Log Export","Dual-Key BYOK Encryption","Agent Version Integrity Lock","Secure Event Hash Ledger","Audit Integrity Verification API"],count:6},
              {c:"c3",ico:"◎",num:"Layer 03",title:"Enterprise Observability & Health Stream",feats:["Real-Time Governance Health API","Org-Scoped Risk Telemetry","OpenTelemetry-Compatible Events","Drift-to-Incident Correlation","Governance Composite Index"],count:10},
              {c:"c4",ico:"⚖",num:"Layer 04",title:"Compliance & Data Intelligence",feats:["PII Exposure Heatmap","Data Residency Tagging","GDPR Article 17 Execution","Automated Compliance Evidence","Retention Policy Engine"],count:10},
              {c:"c5",ico:"◈",num:"Layer 05",title:"Voice Governance Extensions",feats:["Interruption Risk Metric","Voice Latency Drift Heatmap","Audio Stream Integrity","Post-Call Risk Re-Scoring","Over-Talk Collision Index"],count:5},
              {c:"c6",ico:"◆",num:"Layer 06",title:"Billing & Economic Defense",feats:["EU Burn Rate Forecast Engine","Hard Cap Breach Forecasting","Anomalous Billing Spike Detection","Sandbox Isolation Guard","Abuse Detection Engine"],count:10},
              {c:"c7",ico:"◉",num:"Layer 07",title:"Multi-Agent & Enterprise Controls",feats:["Agent Dependency Mapping","Cross-Agent Escalation Tracking","Shared Context Contamination","Role-Level Policy Matrix","Feature Entitlement Engine"],count:10},
              {c:"c8",ico:"⟳",num:"Layer 08",title:"Human-in-the-Loop & AI Behavior Forensics",feats:["Escalation Queue Management","Instruction Override Detection","Agent Behavioral Baseline Profiler","Automated Kill-Switch Policy","Governance Policy Simulation"],count:12},
            ].map(l=>(
              <div key={l.num} className={`hp-lcard ${l.c}`}>
                <div className="hp-lcard-ico">{l.ico}</div>
                <div className="hp-lcard-num">{l.num}</div>
                <div className="hp-lcard-title">{l.title}</div>
                <div className="hp-lcard-feats">
                  {l.feats.map(f=><div key={f} className="hp-lcard-feat">{f}</div>)}
                </div>
                <div className="hp-lcard-count"><strong>{l.count}</strong> Modules</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ MODES ══ */}
      <section className="hp-modes hp-section">
        <div className="hp-section-inner">
          <div className="hp-eyebrow">Platform Modes</div>
          <h2 className="hp-h2">Built for the <strong>Boardroom</strong><br />and the <em>War Room.</em></h2>
          <div className="hp-modes-grid">
            <div className="hp-mode dark">
              <div className="hp-mode-badge exec">Executive Mode</div>
              <h3 className="hp-mode-title">Governance health at a glance. No engineering background required.</h3>
              <p className="hp-mode-desc">Designed for C-suite, legal, compliance, and risk officers. Facttic's Executive Mode translates complex AI behavioral data into clear governance scores, risk signals, and audit-ready snapshots. No noise. Just authority.</p>
              <div className="hp-mode-aud">Audience → CFO · CLO · CISO · Board Risk Committee</div>
              <div className="hp-mode-feats">
                {["Composite Governance Health Score (84/100)","Executive Alert Summary (3 active)","Drift Trend Visualization (30/90 day)","Risk Breakdown Panel (6 dimensions)","Governance Snapshot — Phase 1–6","One-click Compliance Report Export"].map(f=>(
                  <div key={f} className="hp-mode-feat"><span className="hp-mf-check gold">◆</span>{f}</div>
                ))}
              </div>
            </div>
            <div className="hp-mode">
              <div className="hp-mode-badge adv">Advanced Mode</div>
              <h3 className="hp-mode-title">Full behavioral forensics. Every signal. Full control.</h3>
              <p className="hp-mode-desc">Built for AI engineers, platform architects, and security teams. Advanced Mode exposes every governance primitive — prompt hashes, environment snapshots, silent regression indexes, cross-agent risk matrices, and raw event telemetry.</p>
              <div className="hp-mode-aud">Audience → CTO · AI Engineers · Security Ops · Platform Teams</div>
              <div className="hp-mode-feats">
                {["Prompt & Config Integrity Hashing","Environment Snapshot Comparator","Silent Regression Detection Engine","Cross-Agent Anomaly Matrix","Audit Log API (Cryptographic Signature)","Live Governance Health Stream API"].map(f=>(
                  <div key={f} className="hp-mode-feat"><span className="hp-mf-check blue">◆</span>{f}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECURITY ══ */}
      <section className="hp-security hp-section">
        <div className="hp-section-inner">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"start",marginBottom:52}}>
            <div>
              <div className="hp-eyebrow">Security Architecture</div>
              <h2 className="hp-h2">Tamper-Proof.<br /><strong>Cryptographically <em>Proven.</em></strong></h2>
            </div>
            <div style={{paddingTop:28}}>
              <p className="hp-sub">Facttic doesn't just monitor AI governance — it proves it. Every audit event is cryptographically signed, forming an immutable chain that satisfies financial regulators, healthcare auditors, and enterprise security teams.</p>
            </div>
          </div>
          <div className="hp-security-grid">
            <div className="hp-sec-items">
              {[
                {ico:"🔒",num:"Immutable Audit Log",title:"Cryptographic Signature on Every Event",desc:"Every governance event is SHA-256 signed and chained. Any tampering breaks the chain and triggers an immediate integrity alert."},
                {ico:"🗝",num:"Encryption Model",title:"Dual-Key BYOK (Bring Your Own Key)",desc:"Your data is encrypted with your own key. Facttic cannot access your governance data. Full key sovereignty for regulated industries."},
                {ico:"⚡",num:"Session Integrity",title:"Agent Version Lock + Tamper Detection",desc:"Every session is fingerprinted. Any mid-session agent version change, prompt mutation, or config drift is flagged immediately."},
                {ico:"📋",num:"Third-Party Audit",title:"Audit Readiness Export — One Click",desc:"Generate auditor-ready evidence packages with a single action. Supports SOC 2, ISO 27001, HIPAA, and GDPR Article 17 documentation."},
              ].map(s=>(
                <div key={s.num} className="hp-sec-item">
                  <div className="hp-sec-ico">{s.ico}</div>
                  <div>
                    <div className="hp-sec-num">{s.num}</div>
                    <div className="hp-sec-title">{s.title}</div>
                    <div className="hp-sec-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hp-sec-right">
              <div className="hp-sec-rlbl">Live Hash Chain Preview — Audit Log</div>
              <div className="hp-hash-block">
                <div className="hp-hash-lbl">Event Hash — Session INV-0047</div>
                <div className="hp-hash-val">a3f8c2d91b4e67f0a8c34b12d5e9f70821c4b3d6e8f1a2b5c7d9e4f80a1b3c5</div>
                <div className="hp-hash-meta">SHA-256 · Signed 09:17:34 UTC · Block #847291</div>
              </div>
              <div className="hp-hash-block">
                <div className="hp-hash-lbl">Previous Block Hash — Chain Link</div>
                <div className="hp-hash-val">7e2f4a1c9b8d6e5f3a0c7b2d4e6f8a1c3d5e7f9b0a2c4e6d8f1a3b5c7d9e2f4</div>
                <div className="hp-hash-meta">SHA-256 · Signed 09:17:31 UTC · Block #847290</div>
              </div>
              <div className="hp-chain">
                {[
                  {txt:"Chain integrity verified — 847,291 blocks",time:"Live"},
                  {txt:"Zero tamper events — 30 day window",time:"30d"},
                  {txt:"Dual-key encryption active — BYOK enabled",time:"Config"},
                  {txt:"Audit export ready — SOC 2 / GDPR / HIPAA",time:"Ready"},
                ].map(c=>(
                  <div key={c.txt} className="hp-chain-item">
                    <span className="hp-chain-ico">✓</span>
                    <span className="hp-chain-txt">{c.txt}</span>
                    <span className="hp-chain-time">{c.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ COMPLIANCE BADGES ══ */}
      <div className="hp-comp">
        <div className="hp-comp-inner">
          <span className="hp-comp-lbl">Compliance & Infrastructure</span>
          <div className="hp-comp-div" />
          <div className="hp-comp-badges">
            {[["◉","SOC 2 Type II"],["◈","GDPR"],["⬡","HIPAA Ready"],["◆","ISO 27001"],["◎","PCI DSS"],["⚡","EU AI Act"]].map(([ico,name])=>(
              <div key={name} className="hp-comp-badge">
                <span className="hp-cb-ico">{ico}</span>
                <span className="hp-cb-name">{name}</span>
              </div>
            ))}
          </div>
          <div className="hp-comp-right">
            <div className="hp-comp-self">Self-Host / VPC / On-Prem Available</div>
            <div className="hp-comp-self">Enterprise SLA Guaranteed</div>
          </div>
        </div>
      </div>

      {/* ══ POSITIONING ══ */}
      <div className="hp-position">
        <div className="hp-pos-inner">
          <div className="hp-pos-quote">
            <div className="hp-pq-mark">"</div>
            <p className="hp-pq-text">Most AI tools tell you what your agents said. Facttic tells you whether <strong>your agents are still the agents you deployed</strong> — and proves it to your auditors.</p>
            <div className="hp-pq-rule" />
            <div className="hp-pq-attr">Facttic · Product Positioning · Enterprise AI Governance · 2026</div>
          </div>
          <div className="hp-vs-grid">
            {[
              {vs:"vs LangSmith",desc:"Debugging traces, developer-first, purple gradients. Tells engineers what happened in a session.",fact:"Governance control layer. Tells executives whether AI behavior is within authorized boundaries — with proof."},
              {vs:"vs Helicone",desc:"Light observability, gradient cards, cost dashboards. Analytics layer on top of LLM APIs.",fact:"Behavioral enforcement. Cryptographic immutability. Compliance evidence. Multi-mode for C-suite and engineers."},
              {vs:"vs Arize / Galileo",desc:"Model evaluation, bias monitoring, data science tooling. Built for ML teams in research environments.",fact:"Production AI governance. Real-time behavioral control, multi-agent risk, tamper-proof audit chain for regulated industries."},
              {vs:"vs Internal Build",desc:"Months of engineering time, compliance gaps, no deterministic scoring, audit trail gaps, no executive layer.",fact:"Production-ready in days. 80+ governance modules. Board-level Executive Mode. Auditor-ready evidence generation."},
            ].map(v=>(
              <div key={v.vs} className="hp-vs-cell">
                <div className="hp-vs-name">{v.vs}</div>
                <div className="hp-vs-desc">{v.desc}</div>
                <div className="hp-vs-arrow">Facttic →</div>
                <div className="hp-vs-fact">{v.fact}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PRICING ══ */}
      <section className="hp-pricing hp-section">
        <div className="hp-section-inner">
          <div style={{textAlign:"center",marginBottom:56}}>
            <div className="hp-eyebrow hp-eyebrow-center">Platform Tiers</div>
            <h2 className="hp-h2" style={{textAlign:"center"}}>Governance That Scales<br /><strong>with Your AI Risk.</strong></h2>
          </div>
          <div className="hp-pricing-grid">
            {[
              {feat:false,tier:"Tier 01",name:"Governance Foundation",desc:"Core behavioral monitoring, drift detection, and executive dashboard. For teams getting governance-serious.",price:"Contact",psub:"Per Org · Monthly",feats:["Executive Dashboard (Phase 1–3)","Behavioral Drift Detection","Active Alert System","RCA Engine (Standard)","Chat Channel Governance","Audit Log Export"],btn:"ghost",btnTxt:"Request Access"},
              {feat:true, tier:"Tier 02 — Most Popular",name:"Enterprise Governance",desc:"Full 6-phase governance platform with voice, compliance, security layers, and executive + advanced modes.",price:"Contact",psub:"Per Org · Annual · Enterprise SLA",feats:["Everything in Foundation","Voice Governance Layer","PII Heatmap + Compliance Evidence","Tamper-Proof Audit Chain","BYOK Encryption","Advanced Mode (Full Access)"],btn:"solid",btnTxt:"Schedule Enterprise Demo"},
              {feat:false,tier:"Tier 03",name:"Sovereign Platform",desc:"Full platform, self-hosted, with all 12 intelligence layers, multi-agent control, and custom SLAs.",price:"Custom",psub:"Self-Host / VPC / On-Prem",feats:["Everything in Enterprise","Self-Host / VPC Deployment","All 12 Intelligence Layers","Multi-Agent Control Suite","Custom Governance Rules Engine","Dedicated Implementation Team"],btn:"ghost",btnTxt:"Contact Enterprise Sales"},
            ].map(p=>(
              <div key={p.tier} className={`hp-pc${p.feat?" featured":""}`}>
                <div className="hp-pc-tier">{p.tier}</div>
                <div className="hp-pc-name">{p.name}</div>
                <div className="hp-pc-desc">{p.desc}</div>
                <div className="hp-pc-price">{p.price}</div>
                <div className="hp-pc-psub">{p.psub}</div>
                <div className="hp-pc-feats">
                  {p.feats.map(f=>(
                    <div key={f} className="hp-pc-feat">
                      <span className="hp-pc-feat-ico">{p.feat?"◆":"✓"}</span>{f}
                    </div>
                  ))}
                </div>
                <button className={`hp-pc-btn ${p.btn}`}>{p.btnTxt}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <div className="hp-cta">
        <div className="hp-cta-inner">
          <div>
            <div className="hp-cta-lbl">Ready to Govern Your AI?</div>
            <h2 className="hp-cta-title">Your AI agents are live.<br /><strong>Is your governance?</strong></h2>
            <p className="hp-cta-sub">Join enterprise teams who've moved beyond observability into true behavioral control. Request access to the Facttic AI Governance Platform — or schedule a walkthrough with our governance architects.</p>
          </div>
          <div className="hp-cta-right">
            <div className="hp-cta-form">
              <input className="hp-cta-input" type="email" placeholder="your@enterprise.com" />
              <button className="hp-cta-submit">Request Access</button>
            </div>
            <div className="hp-cta-note">No developer setup required · Enterprise trial in 24h · SOC 2 Signed NDA on request</div>
            <button className="hp-btn-ghost" style={{marginTop:4,fontSize:10}}>Schedule Architecture Walkthrough →</button>
          </div>
        </div>
      </div>

    </div>
  );
}
