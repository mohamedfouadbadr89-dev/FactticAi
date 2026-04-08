import React from "react";
import "./home.css";
import { PricingSection } from "@/components/marketing/PricingSection";

export default function MarketingPage() {
  return (
    <div className="hp-root">

      {/* ══ TICKER ══ */}
      <div className="hp-ticker">
        <span className="hp-ticker-label">Integrations</span>
        <div className="hp-ticker-track">
          <div className="hp-ticker-inner">
            {[...Array(2)].map((_, r) => (
              <React.Fragment key={r}>
                {[
                  ["Vapi", "Connected"],
                  ["Retell AI", "Connected"],
                  ["ElevenLabs", "Connected"],
                  ["Bland AI", "Connected"],
                  ["OpenAI", "Connected"],
                  ["Anthropic", "Connected"],
                  ["Pipecat", "Connected"],
                  ["Azure OpenAI", "Connected"],
                  ["Voice + Chat", "Both supported"],
                  ["Webhook setup", "< 5 minutes"],
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
              AI Governance for Voice &amp; Chat
            </div>
            <h1 className="hp-hero-title hp-a-fadeup hp-a2">
              One wrong response.
              <strong>One compliance violation.</strong>
              <em>Facttic makes sure it never happens.</em>
            </h1>
            <p className="hp-hero-desc hp-a-fadeup hp-a3">
              Connect your voice agent or LLM in minutes. Set your policies.
              Facttic monitors every conversation — and alerts you the moment something goes wrong.
            </p>
            <div className="hp-hero-actions hp-a-fadeup hp-a4">
              <a href="/login" className="hp-btn-primary">Start Free →</a>
              <a href="#how-it-works" className="hp-btn-ghost">See how it works</a>
            </div>
            <div className="hp-trust hp-a-fadeup hp-a5">
              {[
                { label: "Vapi" },
                { label: "Retell AI" },
                { label: "ElevenLabs" },
                { label: "OpenAI" },
                { label: "Anthropic" },
                { label: "Bland AI" },
              ].map((t, i) => (
                <React.Fragment key={t.label}>
                  {i > 0 && <div className="hp-trust-div" />}
                  <div className="hp-trust-item">{t.label}</div>
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
                  <div className="hp-dp-org">Acme Voice AI</div>
                </div>
                <div className="hp-dp-score">
                  <div>
                    <div className="hp-dp-scorelbl">Risk Score</div>
                    <div className="hp-dp-scorenum">LOW</div>
                  </div>
                </div>
                <div className="hp-dp-tamper">
                  <div className="hp-dp-tamper-dot" />
                  <div className="hp-dp-tamper-txt">Monitoring</div>
                </div>
              </div>

              <div className="hp-dp-body">
                <div className="hp-dp-sidebar">
                  <div className="hp-dp-sec">Governance</div>
                  <div className="hp-dp-nav on">
                    <svg viewBox="0 0 10 10" fill="none"><rect x="0.5" y="0.5" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/><rect x="6" y="0.5" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/><rect x="0.5" y="6" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/><rect x="6" y="6" width="3.5" height="3.5" stroke="currentColor" strokeWidth="1"/></svg>
                    Dashboard
                  </div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1"/><path d="M5 2.5v3l1.5 1" stroke="currentColor" strokeWidth="1"/></svg>
                    Live Monitor
                  </div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M5 0.5l1.5 3L9.5 4l-2.5 2.5.5 3.5L5 8.5 2.5 10l.5-3.5L0.5 4l3-0.5z" stroke="currentColor" strokeWidth="1"/></svg>
                    Alerts
                  </div>
                  <div className="hp-dp-sec">Forensics</div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1"/><path d="M7 7l2 2" stroke="currentColor" strokeWidth="1"/></svg>
                    Session Replay
                  </div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><rect x="1" y="3" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1"/><path d="M3 3V2a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1"/></svg>
                    Forensics
                  </div>
                  <div className="hp-dp-sec">Testing</div>
                  <div className="hp-dp-nav">
                    <svg viewBox="0 0 10 10" fill="none"><path d="M3 1h4l1 3H2L3 1z" stroke="currentColor" strokeWidth="1"/><rect x="1" y="4" width="8" height="5" rx="0.5" stroke="currentColor" strokeWidth="1"/></svg>
                    Simulation
                  </div>
                </div>

                <div className="hp-dp-main">
                  <div className="hp-dp-score-row">
                    <div className="hp-dp-big" style={{fontSize:20,color:"#2ECC71"}}>ALLOW</div>
                    <div className="hp-dp-meta">
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val">128</span><span className="hp-dp-sm-lbl">Sessions</span></div>
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val">43</span><span className="hp-dp-sm-lbl">Voice Calls</span></div>
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val" style={{color:"#E74C3C"}}>2</span><span className="hp-dp-sm-lbl">Violations</span></div>
                      <div className="hp-dp-sm"><span className="hp-dp-sm-val" style={{color:"#F39C12"}}>1</span><span className="hp-dp-sm-lbl">Blocked</span></div>
                    </div>
                  </div>
                  <div className="hp-dp-chart">
                    <div className="hp-dp-chart-lbl">Risk Events — Last 7 Days</div>
                    <svg viewBox="0 0 320 50" preserveAspectRatio="none" style={{width:"100%",height:48}}>
                      <path d="M0,45 L40,40 L80,42 L120,35 L160,38 L200,25 L240,20 L280,28 L320,15" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5"/>
                      <path d="M0,45 L40,40 L80,42 L120,35 L160,38 L200,25 L240,20 L280,28 L320,15 L320,50 L0,50 Z" fill="rgba(201,168,76,0.06)"/>
                      <circle cx="200" cy="25" r="3" fill="#E74C3C"/>
                      <circle cx="320" cy="15" r="3.5" fill="#F39C12"/>
                    </svg>
                  </div>
                  <div className="hp-dp-alerts">
                    {[
                      {col:"#E74C3C",txt:"Jailbreak attempt detected — Voice Channel",tag:"BLOCK",tagCol:"#E74C3C"},
                      {col:"#F39C12",txt:"Policy violation — off-topic response",tag:"WARN",tagCol:"#F39C12"},
                      {col:"#2ECC71",txt:"128 sessions monitored — all within policy",tag:"OK",tagCol:"#2ECC71"},
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
                <div className="hp-dp-badge">Governance Dashboard · Live View</div>
                <div style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"rgba(255,255,255,0.2)",letterSpacing:1}}>Real-time monitoring active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ METRICS BAR ══ */}
      <div className="hp-metrics">
        <div className="hp-metrics-inner">
          {[
            {lbl:"Setup Time",num:"5",sup:"min",desc:"Webhook connected — no SDK required"},
            {lbl:"Integrations",num:"7",sup:"+",desc:"Voice & chat providers supported"},
            {lbl:"Decision Types",num:"2",sup:"",desc:"BLOCK or ALLOW — every conversation"},
            {lbl:"Alert Latency",num:"<1",sup:"s",desc:"Real-time violation detection"},
            {lbl:"Session Types",num:"All",sup:"",desc:"Voice calls and chat threads"},
          ].map(m => (
            <div key={m.lbl} className="hp-metric">
              <div className="hp-metric-lbl">{m.lbl}</div>
              <div className="hp-metric-num">{m.num}<span>{m.sup}</span></div>
              <div className="hp-metric-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="hp-what hp-section">
        <div className="hp-section-inner">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:48,alignItems:"start",marginBottom:60}}>
            <div>
              <div className="hp-eyebrow">How it works</div>
              <h2 className="hp-h2">Connected in minutes.<br /><strong>Governing <em>forever.</em></strong></h2>
            </div>
            <div style={{paddingTop:32}}>
              <p className="hp-sub">No SDK. No code changes to your existing stack. Just point your voice platform or LLM at a webhook URL — and Facttic starts governing every conversation from that moment.</p>
            </div>
          </div>
          <div className="hp-what-grid">
            <div className="hp-notvs">
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {[
                  {num:"01",title:"Connect your platform",desc:"Copy your Facttic webhook URL. Paste it into Vapi, Retell, ElevenLabs, Bland, or any other provider. Takes under 5 minutes.",tag:"Vapi · Retell · ElevenLabs · Bland · OpenAI · Anthropic · Pipecat"},
                  {num:"02",title:"Set your policies",desc:"Define what your AI can and can't say. Block topics, flag sensitive content, set risk thresholds. No code — just rules.",tag:"Policy rules · Risk thresholds · Blocked topics"},
                  {num:"03",title:"Govern every conversation",desc:"Every session gets analyzed in real-time. BLOCK or ALLOW. Risk score assigned. Alert sent if needed. Full audit trail kept.",tag:"BLOCK / ALLOW · Risk score · Alerts · Audit log"},
                ].map((s,i) => (
                  <div key={s.num} className="hp-sec-item" style={{borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none", paddingBottom:24, marginBottom:24}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,color:"var(--hp-gold)",letterSpacing:2,flexShrink:0,marginTop:2}}>{s.num}</div>
                    <div>
                      <div className="hp-sec-title">{s.title}</div>
                      <div className="hp-sec-desc">{s.desc}</div>
                      <div style={{marginTop:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--text-muted)",letterSpacing:1}}>{s.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hp-what-stats">
              <div className="hp-sec-rlbl" style={{marginBottom:16}}>What Facttic catches</div>
              {[
                {ico:"🚫",lbl:"Jailbreak attempts",desc:"Detect when users try to manipulate your AI agent into breaking its rules."},
                {ico:"⚠️",lbl:"Policy violations",desc:"Flag responses that break your defined content policies or topic restrictions."},
                {ico:"💬",lbl:"Hallucinations",desc:"Identify when your AI confidently says something that isn't true."},
                {ico:"🔒",lbl:"Sensitive data leaks",desc:"Catch when your AI reveals PII, credentials, or confidential information."},
                {ico:"📉",lbl:"Behavioral drift",desc:"Detect when your agent starts behaving differently from how it was deployed."},
                {ico:"💉",lbl:"Prompt injection",desc:"Identify attempts to override system instructions via user messages."},
              ].map(s=>(
                <div key={s.lbl} className="hp-wstat" style={{marginBottom:16}}>
                  <div style={{fontSize:18,flexShrink:0}}>{s.ico}</div>
                  <div><div className="hp-wstat-lbl">{s.lbl}</div><div className="hp-wstat-desc">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <div className="hp-layers">
        <div className="hp-section-inner">
          <div className="hp-layers-header">
            <div>
              <div className="hp-eyebrow" style={{color:"var(--hp-gold)"}}>Platform Features</div>
              <h2 className="hp-layers-h2">Everything you need<br /><strong>to govern <em>AI in production.</em></strong></h2>
            </div>
            <div>
              <p className="hp-layers-sub">From the moment a conversation starts to the moment you need to investigate an incident — Facttic covers the full lifecycle of AI governance.</p>
            </div>
          </div>
          <div className="hp-layers-grid">
            {[
              {c:"c1",ico:"🟢",num:"Live Monitor",title:"Real-time session monitoring",feats:["See every voice call and chat as it happens","Risk score updated in real-time","BLOCK / ALLOW decisions surfaced instantly","Alert triggered on first violation"]},
              {c:"c2",ico:"▶",num:"Session Replay",title:"Go back to any conversation",feats:["Full transcript of every session","Replay voice calls step by step","See exactly when and where things went wrong","Export for compliance review"]},
              {c:"c3",ico:"🔍",num:"Forensics",title:"Deep investigation tools",feats:["Search across all sessions by keyword","Filter by risk level, provider, date","Timeline view of every event","Build incident reports"]},
              {c:"c4",ico:"🧪",num:"Simulation Lab",title:"Test before you ship",feats:["Run test conversations against your policies","Catch violations before production","Simulate edge cases and jailbreak attempts","Validate policy changes safely"]},
              {c:"c5",ico:"🔔",num:"Alerts & Webhooks",title:"Get notified immediately",feats:["Webhook fired on every violation","Slack, email, or any HTTP endpoint","Filter by event type and severity","HMAC-signed payloads for security"]},
              {c:"c6",ico:"📊",num:"Reports",title:"Audit-ready exports",feats:["Download compliance reports","Session summary by date range","Violation breakdown by type","Share with legal or compliance teams"]},
              {c:"c7",ico:"⚙️",num:"Policy Engine",title:"Define your own rules",feats:["Set blocked topics and content types","Define risk thresholds per channel","Different rules for voice vs chat","Unlimited rules on Growth and Scale"]},
              {c:"c8",ico:"🔌",num:"Integrations",title:"Works with your stack",feats:["Vapi · Retell AI · ElevenLabs · Bland AI","OpenAI · Anthropic · Azure · Pipecat","Webhook-based — no SDK needed","Connect any provider with an HTTP call"]},
            ].map(l=>(
              <div key={l.num} className={`hp-lcard ${l.c}`}>
                <div className="hp-lcard-ico">{l.ico}</div>
                <div className="hp-lcard-num">{l.num}</div>
                <div className="hp-lcard-title">{l.title}</div>
                <div className="hp-lcard-feats">
                  {l.feats.map(f=><div key={f} className="hp-lcard-feat">{f}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ COMPLIANCE BADGES ══ */}
      <div className="hp-comp">
        <div className="hp-comp-inner">
          <span className="hp-comp-lbl">Compliance Ready</span>
          <div className="hp-comp-div" />
          <div className="hp-comp-badges">
            {[["◉","SOC 2 Type II"],["◈","GDPR"],["⬡","HIPAA Ready"],["◆","ISO 27001"],["◎","EU AI Act"]].map(([ico,name])=>(
              <div key={name} className="hp-comp-badge">
                <span className="hp-cb-ico">{ico}</span>
                <span className="hp-cb-name">{name}</span>
              </div>
            ))}
          </div>
          <div className="hp-comp-right">
            <div className="hp-comp-self">Self-Host / VPC available on Scale</div>
            <div className="hp-comp-self">Custom SLA on Scale</div>
          </div>
        </div>
      </div>

      {/* ══ PRICING ══ */}
      <section className="hp-pricing hp-section">
        <div className="hp-section-inner">
          <PricingSection />
        </div>
      </section>

      {/* ══ CTA ══ */}
      <div className="hp-cta">
        <div className="hp-cta-inner">
          <div>
            <div className="hp-cta-lbl">Start governing your AI today</div>
            <h2 className="hp-cta-title">Your AI agents are live right now.<br /><strong>Do you know what they&apos;re saying?</strong></h2>
            <p className="hp-cta-sub">Connect your voice platform or LLM in under 5 minutes. No code changes. No SDK. Just a webhook URL and your first policy rule.</p>
          </div>
          <div className="hp-cta-right">
            <div className="hp-cta-form">
              <input className="hp-cta-input" type="email" placeholder="your@company.com" />
              <a href="/login" className="hp-cta-submit">Start Free →</a>
            </div>
            <div className="hp-cta-note">Free trial included · No credit card required · Setup in 5 minutes</div>
            <a href="/pricing" className="hp-btn-ghost" style={{marginTop:4,fontSize:10}}>See full pricing →</a>
          </div>
        </div>
      </div>

    </div>
  );
}
