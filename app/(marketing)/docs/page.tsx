"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const subNav = [
  { id: "user-guide", label: "User Guide" },
  { id: "api-reference", label: "API Reference" },
  { id: "integrations", label: "Integrations" },
  { id: "changelog", label: "Changelog" },
];

const sidebarSections = [
  {
    title: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "quickstart", label: "Quick Start" },
      { id: "authentication", label: "Authentication" },
      { id: "concepts", label: "Core Concepts" },
    ],
  },
  {
    title: "Governance API",
    items: [
      { id: "execute", label: "Execute Endpoint" },
      { id: "sessions", label: "Sessions" },
      { id: "alerts", label: "Alerts" },
      { id: "compliance", label: "Compliance Signals" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { id: "openai", label: "OpenAI Gateway" },
      { id: "anthropic", label: "Anthropic Proxy" },
      { id: "webhooks", label: "Webhooks" },
      { id: "sdk", label: "SDK Reference" },
    ],
  },
  {
    title: "Platform",
    items: [
      { id: "dashboard", label: "Dashboard Overview" },
      { id: "simulation", label: "Simulation Engine" },
      { id: "forensics", label: "Forensics & Replay" },
      { id: "sla", label: "SLA & Uptime" },
    ],
  },
];

const docContent: Record<string, { title: string; content: React.ReactNode }> = {
  introduction: {
    title: "Introduction to Facttic.AI",
    content: (
      <div className="space-y-6">
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          Facttic.AI is an institutional-grade AI governance platform providing deterministic behavioral enforcement, real-time risk attribution, and cryptographic audit integrity for regulated enterprise environments.
        </p>
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg p-5">
          <p className="text-[12px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Core Principle</p>
          <p className="text-[13px] text-[var(--text-primary)]">
            Every AI interaction is intercepted, evaluated against your governance policy, and cryptographically logged — before the response reaches your users.
          </p>
        </div>
        <h3 className="text-[16px] font-semibold text-[var(--text-primary)] pt-2">What Facttic.AI Provides</h3>
        <ul className="space-y-3">
          {[
            "Semantic policy enforcement at the inference layer",
            "Real-time behavioral drift detection and alerting",
            "Cryptographic audit chain with SHA-256 integrity",
            "Executive health indexing and governance scoring",
            "Full compliance mapping: SOC2, GDPR, HIPAA, ISO 27001",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
              <span className="text-[13px] text-[var(--text-secondary)]">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  quickstart: {
    title: "Quick Start",
    content: (
      <div className="space-y-6">
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          Get your first governance policy running in under 5 minutes.
        </p>
        <div className="space-y-4">
          {[
            { step: "01", title: "Obtain API Key", desc: "Navigate to Dashboard → Settings → API Keys and create a new governance key." },
            { step: "02", title: "Send Your First Request", desc: "POST to /api/governance/execute with your API key as a Bearer token." },
            { step: "03", title: "View Results", desc: "Check the Dashboard → Playground to see real-time ALLOW/BLOCK decisions with risk scores." },
          ].map((s) => (
            <div key={s.step} className="flex gap-5 p-5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl">
              <div className="text-[11px] font-mono font-black text-[var(--accent)] opacity-50 w-8 shrink-0 pt-0.5">{s.step}</div>
              <div>
                <h4 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{s.title}</h4>
                <p className="text-[12px] text-[var(--text-muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-xl p-5 font-mono text-[12px] text-[var(--text-secondary)]">
          <div className="text-[var(--text-muted)] mb-3 text-[10px] uppercase tracking-widest">Example Request</div>
          <pre className="overflow-x-auto leading-relaxed">{`curl -X POST https://facttic.ai/api/governance/execute \\
  -H "Authorization: Bearer fai_key_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "User message here",
    "model": "gpt-4o",
    "context": { "user_role": "analyst" }
  }'`}</pre>
        </div>
      </div>
    ),
  },
  execute: {
    title: "Execute Endpoint",
    content: (
      <div className="space-y-6">
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          The primary governance endpoint that intercepts and evaluates every AI request against your configured policy framework.
        </p>
        <div className="flex items-center gap-3 p-4 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg">
          <span className="px-2.5 py-1 bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-mono font-black rounded uppercase">POST</span>
          <code className="text-[12px] font-mono text-[var(--text-primary)]">/api/governance/execute</code>
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">Request Body</h3>
          <div className="bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-xl p-5 font-mono text-[12px] text-[var(--text-secondary)] overflow-x-auto">
            <pre>{`{
  "prompt":  string,          // Required. The user input to evaluate.
  "model":   string,          // Required. Target LLM model identifier.
  "context": {
    "user_role":   string,    // Optional. RBAC role for policy matching.
    "session_id":  string,    // Optional. For session continuity tracking.
    "org_id":      string     // Resolved server-side from API key.
  }
}`}</pre>
          </div>
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">Response</h3>
          <div className="bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-xl p-5 font-mono text-[12px] text-[var(--text-secondary)] overflow-x-auto">
            <pre>{`{
  "decision":     "ALLOW" | "BLOCK" | "REDACT",
  "risk_score":   number,   // 0–100
  "policy_id":    string,
  "session_id":   string,
  "audit_hash":   string,   // SHA-256 of request+decision
  "violations":   string[]  // Policy rules triggered
}`}</pre>
          </div>
        </div>
      </div>
    ),
  },
  authentication: {
    title: "Authentication",
    content: (
      <div className="space-y-6">
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          Facttic.AI uses Bearer API keys for external integrations and session-based auth for the dashboard.
        </p>
        <div className="space-y-4">
          <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl">
            <h4 className="text-[12px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">API Key Authentication</h4>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">Used for the /api/governance/execute endpoint from external systems.</p>
            <div className="bg-[var(--surface-3)] rounded-lg p-4 font-mono text-[11px] text-[var(--text-secondary)]">
              <pre>Authorization: Bearer fai_key_your_key_here</pre>
            </div>
          </div>
          <div className="p-5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl">
            <h4 className="text-[12px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-2">Session Authentication</h4>
            <p className="text-[12px] text-[var(--text-muted)]">Dashboard and internal API routes authenticate via Supabase session tokens managed by the browser client.</p>
          </div>
        </div>
      </div>
    ),
  },
};

// ─── Ask AI Knowledge Base ────────────────────────────────────────────────────

const KB: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["vapi", "elevenlabs", "eleven labs", "pipecat", "retell", "voice ai", "voice agent", "voice platform", "speech", "tts", "stt", "real-time voice", "conversational ai", "voice bot"],
    answer: "Yes — Facttic.AI works with voice AI platforms like Vapi, ElevenLabs, Pipecat, and Retell.\n\nHow it works:\n• These platforms generate LLM prompts internally (from transcribed speech)\n• You configure them to route those prompts through Facttic's /api/governance/execute BEFORE sending to the LLM\n• Facttic evaluates the prompt → returns ALLOW/BLOCK/REDACT in <50ms\n• The voice platform receives the decision and acts accordingly\n\nFor Vapi specifically: use the custom LLM endpoint feature and point it to your Facttic-wrapped inference layer. Same applies to Pipecat pipelines and Retell custom LLM mode.\n\nThis gives you full governance over what your voice agents say — blocking jailbreaks, PII leaks, and off-topic responses at the voice layer.",
  },
  {
    keywords: ["integrat", "openai", "anthropic", "claude", "gpt", "proxy", "gateway", "llm", "model", "provider", "connect", "use with", "work with", "compatible"],
    answer: "Facttic.AI is provider-agnostic — it works as a governance layer in front of any LLM:\n\n• OpenAI (GPT-4o, GPT-4, GPT-3.5)\n• Anthropic (Claude 3.5, Claude 3 Opus)\n• Google (Gemini Pro, Gemini Flash)\n• Custom/fine-tuned models\n• Voice platforms: Vapi, ElevenLabs, Pipecat, Retell\n\nIntegration pattern: instead of calling the LLM directly, POST to /api/governance/execute first. If decision is ALLOW, forward the prompt to your LLM. If BLOCK, suppress the response.\n\nSDKs: TypeScript, Python, Go. REST API for everything else.",
  },
  {
    keywords: ["webhook", "event", "async", "callback", "notify", "notification"],
    answer: "Facttic.AI supports webhooks for asynchronous governance events. Configure a webhook URL in Dashboard → Settings → Webhooks. Events include: BLOCK_DECISION, DRIFT_ALERT, COMPLIANCE_BREACH, and POLICY_VIOLATION. Each event payload includes the audit_hash, org_id, risk_score, and decision details.",
  },
  {
    keywords: ["sdk", "library", "package", "npm", "pip", "install"],
    answer: "Official SDKs available:\n• TypeScript/JS: npm install @facttic/sdk\n• Python: pip install facttic-sdk\n• Go: go get github.com/facttic/sdk-go\n\nEach SDK wraps the /api/governance/execute endpoint with typed request/response models, retry logic, and automatic audit log streaming.",
  },
  {
    keywords: ["execute", "endpoint", "/api/governance", "request", "body", "payload", "call", "post"],
    answer: "POST /api/governance/execute\n\nHeaders: Authorization: Bearer fai_key_xxx\n\nRequest body:\n• prompt (string, required) — user input\n• model (string, required) — target LLM model\n• context.user_role — RBAC role for policy matching\n• context.session_id — for session continuity\n\nResponse:\n• decision: ALLOW | BLOCK | REDACT\n• risk_score: 0–100\n• audit_hash: SHA-256 fingerprint\n• violations: policy rules triggered",
  },
  {
    keywords: ["auth", "authenticat", "api key", "bearer", "token", "secret", "credential", "login", "access"],
    answer: "Two auth methods:\n\n1. API Key (external integrations): Generate from Dashboard → Settings → API Keys. Use as: Authorization: Bearer fai_key_xxx\n\n2. Session Auth (dashboard): Managed automatically via Supabase SSR sessions — no manual token handling needed.\n\nAPI keys are stored as bcrypt hashes. Only shown once at creation time.",
  },
  {
    keywords: ["quickstart", "get started", "start", "begin", "first", "setup", "install", "onboard", "how to"],
    answer: "Quick start in 3 steps:\n1. Dashboard → Settings → API Keys → create key\n2. POST to /api/governance/execute with Bearer token + prompt + model\n3. Dashboard → Playground to see real-time ALLOW/BLOCK decisions with risk scores\n\nFirst request typically takes <50ms. Check Dashboard → Forensics to replay and audit any session.",
  },
  {
    keywords: ["decision", "allow", "block", "redact", "enforce", "policy", "rule", "violation"],
    answer: "Every request receives one of three decisions:\n• ALLOW — prompt passes all governance policies\n• BLOCK — prompt violates one or more policies (response is suppressed)\n• REDACT — prompt allowed but PII/PHI fields are stripped before reaching the model\n\nDecisions are cryptographically signed with SHA-256 and written to the immutable evidence ledger.",
  },
  {
    keywords: ["risk", "score", "risk score", "risk_score", "danger", "threat", "level"],
    answer: "The risk_score (0–100) is a composite of:\n• Semantic policy match confidence\n• Behavioral drift delta from baseline\n• Session-level anomaly indicators\n• Historical violation rate for this user role\n\nScores ≥70 trigger automatic alerts. Scores ≥90 result in BLOCK decisions under default policy config.",
  },
  {
    keywords: ["audit", "log", "ledger", "evidence", "hash", "sha256", "sha-256", "chain", "immutable", "record"],
    answer: "Every governance decision is written to the cryptographic evidence ledger (facttic_governance_events table) with:\n• SHA-256 hash of request + context + decision\n• Timestamp (UTC)\n• org_id isolation\n• Policy version at decision time\n\nLedger entries cannot be altered retroactively. Export available in Dashboard → Compliance → Export Ledger.",
  },
  {
    keywords: ["session", "sessions", "turn", "conversation", "history", "replay", "forensic"],
    answer: "Sessions group related governance events across a conversation. Each session has:\n• session_id (UUID)\n• session_turns — individual request/decision pairs\n• Risk trajectory over time\n\nUse Dashboard → Forensics to replay any session turn-by-turn and see exactly what policy was evaluated at each step.",
  },
  {
    keywords: ["alert", "alarm", "notify", "drift alert", "trigger", "threshold", "warning"],
    answer: "Governance alerts are automatically triggered when:\n• Risk score exceeds configured threshold (default: 70)\n• Behavioral drift exceeds 15% delta from baseline\n• Compliance signal breach detected\n• Multiple BLOCK decisions within a session window\n\nAlerts appear in Dashboard → Alerts and can be forwarded via webhook or email.",
  },
  {
    keywords: ["compliance", "soc2", "gdpr", "hipaa", "iso", "nist", "regulation", "framework", "standard"],
    answer: "Facttic.AI maps governance signals to:\n• SOC2 Type II — audit log completeness, access controls\n• GDPR — PII detection + REDACT decisions, data locality\n• HIPAA — PHI blocking, BAA available on Enterprise+\n• ISO 27001 — policy management + evidence chain\n• NIST AI RMF — risk categorization and mitigation\n\nCompliance dashboard: Dashboard → Compliance → Signals.",
  },
  {
    keywords: ["pii", "phi", "personal", "sensitive", "data", "privacy", "redact", "mask"],
    answer: "PII/PHI detection runs at the governance layer before prompts reach any LLM. Detected fields are:\n• Automatically REDACTED from the forwarded prompt\n• Flagged in the audit log\n• Never stored in session_turns\n\nDetection uses pattern matching + semantic classification. Sensitivity level is configurable per org policy.",
  },
  {
    keywords: ["drift", "behavioral drift", "anomaly", "baseline", "deviation", "shift"],
    answer: "Behavioral drift detection uses sliding-window statistical analysis over AI output distributions. When output patterns deviate >15% from the org's governance baseline:\n1. Drift alert is triggered (governance_alerts table)\n2. Risk score is elevated for subsequent requests\n3. Executive Health Index is updated\n\nBaseline is established over the first 30 days of deployment.",
  },
  {
    keywords: ["health", "health index", "health score", "executive", "governance score", "dashboard score"],
    answer: "The Governance Health Index (0–100) is a composite score from:\n• Behavioral compliance rate (30%)\n• Drift velocity — rate of change (20%)\n• Alert frequency normalized by volume (25%)\n• Policy coverage — % of requests governed (15%)\n• Incident resolution time (10%)\n\nVisible at top of Dashboard. Updated in real-time.",
  },
  {
    keywords: ["simulation", "simulate", "test", "scenario", "traffic", "load", "playground"],
    answer: "Two testing environments:\n\n• Playground (Dashboard → Playground): Send single test prompts and see live ALLOW/BLOCK decisions with risk breakdown.\n\n• Simulation Engine (Dashboard → Simulation): Run multi-scenario traffic simulations — 'Prompt Injection Attack', 'Data Exfiltration', etc. — to stress-test your policy configuration before production.",
  },
  {
    keywords: ["price", "pricing", "cost", "tier", "plan", "foundation", "enterprise", "sovereign", "billing"],
    answer: "Three governance tiers:\n\n• Foundation — Enterprise entry. Control plane, semantic enforcement, audit logs. Standard SLA.\n\n• Enterprise — Full platform. Health indexing, drift alerts, 99.99% SLA, dedicated support. (Recommended)\n\n• Sovereign — Air-gapped enclaves, hardware-root trust, BYOK encryption, custom SLA. For critical infrastructure.\n\nAll prices are enterprise contract — visit /pricing for details.",
  },
  {
    keywords: ["latency", "performance", "speed", "fast", "slow", "ms", "millisecond", "overhead"],
    answer: "Governance pipeline latency: <50ms p99 under standard load. This includes:\n• Semantic policy evaluation\n• Risk score computation\n• Audit log write (async, non-blocking)\n\nSovereign deployments with hardware-root validation: +10ms. Latency does not scale with prompt length — evaluation operates on semantic embeddings.",
  },
  {
    keywords: ["byok", "bring your own key", "encryption", "encrypt", "kms", "key management", "key rotation", "data encryption", "cipher", "at rest", "in transit"],
    answer: "Yes — BYOK (Bring Your Own Key) is supported on the Sovereign Platform tier.\n\nWhat this means:\n• You provide your own encryption keys via your KMS (AWS KMS, Azure Key Vault, GCP KMS, or self-hosted)\n• All audit logs, governance events, and session data are encrypted using your keys\n• Facttic never has access to plaintext key material\n• Key rotation is handled by your KMS — Facttic automatically re-encrypts on rotation\n\nBYOK is available on the Sovereign tier. For Enterprise tier, Facttic manages encryption with SOC2-certified key management. Contact the implementation team to configure your KMS integration.",
  },
  {
    keywords: ["air gap", "air-gap", "offline", "isolated", "on-premise", "on-prem", "sovereign", "enclave", "critical infrastructure", "state system"],
    answer: "The Sovereign Platform tier supports fully air-gapped deployments:\n• Dedicated compute enclave — no shared infrastructure\n• Hardware-root trust validation (TPM-based)\n• BYOK (Bring Your Own Key) encryption\n• Custom SLA and dedicated implementation team\n• Supports fully offline audit log storage\n\nContact the implementation team to design your air-gapped architecture.",
  },
  {
    keywords: ["org", "organization", "tenant", "multi-tenant", "isolat", "workspace"],
    answer: "Facttic.AI enforces hard multi-tenant isolation:\n• Every DB query is scoped by org_id\n• API keys are scoped to a single org\n• Governance policies, alerts, sessions, and audit logs are fully isolated per tenant\n• Network-level isolation on Sovereign deployments\n\nTenant resolution: org_id is derived server-side from the API key — never trusted from client input.",
  },
  {
    keywords: ["incident", "breach", "violation", "issue", "problem", "resolve"],
    answer: "Incidents are created when governance events exceed severity thresholds. Workflow:\n1. Alert triggered → incident auto-created in Dashboard → Incidents\n2. Assign to team member + set priority\n3. Review forensic replay of triggering sessions\n4. Document resolution + close incident\n\nAll incident activity is written to the audit chain for compliance reporting.",
  },
  {
    keywords: ["what is facttic", "what is it", "what does facttic do", "how does facttic work", "overview", "about facttic", "tell me about", "introduce"],
    answer: "Facttic.AI is an institutional AI governance platform. It acts as an intelligence layer between your application and your AI provider:\n\n1. Every AI request is intercepted\n2. Evaluated against your semantic governance policies\n3. A ALLOW/BLOCK/REDACT decision is made in <50ms\n4. Everything is cryptographically logged\n\nThis gives enterprises deterministic behavioral control over production AI systems — without changing their AI provider.",
  },
];

// Clarification triggers — short queries with no real topic signal
const CLARIFICATION_PATTERNS = [
  "what do you mean", "what does that mean", "i don't understand", "can you explain",
  "explain that", "clarify", "what?", "huh?", "i mean", "more detail", "tell me more",
  "elaborate", "can you be more specific", "so basically", "so you mean",
];

// "Can I use X?" — extract the X and search for it
function extractCandidateTool(q: string): string {
  const canUseMatch = q.match(/(?:can i use|does .* support|work with|compatible with|integrate with)\s+([a-z0-9\s]+?)(?:\?|$|with facttic| to)/i);
  return canUseMatch ? canUseMatch[1].trim() : "";
}

function scoreEntry(q: string, entry: { keywords: string[] }): number {
  const words = q.split(/\s+/);
  let score = 0;
  for (const kw of entry.keywords) {
    if (q.includes(kw)) {
      score += kw.length * 2; // exact substring match — weighted by specificity
    }
  }
  for (const word of words) {
    if (word.length > 4) {
      for (const kw of entry.keywords) {
        if (kw.includes(word) || word.includes(kw)) score += 3;
      }
    }
  }
  return score;
}

function getAIResponse(query: string, lastAIMessage?: string): string {
  const q = query.toLowerCase().trim();

  // 2. "can I use X?" pattern — augment the query with the extracted tool name
  const toolCandidate = extractCandidateTool(q);
  const augmentedQ = toolCandidate ? `${q} ${toolCandidate} integrat` : q;

  // Score all KB entries first
  let bestScore = 0;
  let bestAnswer = "";
  for (const entry of KB) {
    const score = scoreEntry(augmentedQ, entry);
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = entry.answer;
    }
  }

  // 1. Detect clarification request ONLY if there's no strong topic signal
  const isClarification = CLARIFICATION_PATTERNS.some((p) => q.includes(p));
  if (isClarification && bestScore < 8 && lastAIMessage) {
    return `To clarify:\n\n${lastAIMessage}\n\nFeel free to ask a more specific follow-up!`;
  }

  // 3. If score is too low, give a helpful fallback with suggestions
  if (bestScore < 4) {
    return `I don't have specific docs on that yet.\n\nYou can ask me about:\n• Vapi, ElevenLabs, Pipecat, Retell voice integrations\n• The governance execute API & decisions\n• Authentication & API keys\n• Compliance (SOC2, GDPR, HIPAA, ISO 27001)\n• Risk scores & drift detection\n• Pricing tiers\n• Simulation & Playground\n\nOr check the left sidebar for the relevant docs section.`;
  }

  return bestAnswer;
}

// ─── Ask AI Panel ─────────────────────────────────────────────────────────────

function AskAIPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm the Facttic.AI docs assistant. Ask me about integrations, the governance API, authentication, compliance frameworks, drift detection, or anything else about the platform." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function send() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    // Capture last AI message for context before state update
    const lastAI = [...messages].reverse().find((m) => m.role === "ai")?.text;
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    const delay = 600 + Math.random() * 500;
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: getAIResponse(userMsg, lastAI) }]);
      setLoading(false);
    }, delay);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 9L6 3L10 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[12px] font-mono font-bold text-[var(--text-primary)]">Ask AI</span>
          <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
          aria-label="Close AI panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-mono font-black ${msg.role === "ai" ? "bg-[var(--accent)] text-white" : "bg-[var(--border-primary)] text-[var(--text-muted)]"}`}>
              {msg.role === "ai" ? "AI" : "U"}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[12px] leading-relaxed whitespace-pre-line ${msg.role === "ai" ? "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-tl-sm" : "bg-[var(--accent)] text-white rounded-tr-sm"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[9px] font-mono font-black text-white shrink-0">AI</div>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl px-4 py-2.5 focus-within:border-[var(--accent)] transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask about APIs, policies, integrations..."
            className="flex-1 bg-transparent text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 10L10 6L2 2V5.5L7.5 6L2 6.5V10Z" fill="white" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] font-mono text-[var(--text-muted)] text-center mt-2 opacity-60">
          Press Enter to send · AI responses are illustrative
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [activeSubNav, setActiveSubNav] = useState("user-guide");
  const [aiOpen, setAiOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const content = docContent[activeSection] ?? docContent["introduction"];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Docs Sub-Nav */}
      <div className="sticky top-[65px] z-40 bg-[var(--surface-1)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-between h-12">
            {/* Sub Nav Tabs */}
            <div className="flex items-center gap-0">
              {subNav.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubNav(tab.id)}
                  className={`px-4 h-12 text-[11px] font-mono font-semibold border-b-2 transition-colors ${
                    activeSubNav === tab.id
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Search + Ask AI */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className={`flex items-center gap-2.5 px-3.5 py-2 border rounded-lg transition-all ${searchFocused ? "border-[var(--accent)] bg-[var(--bg-elevated)]" : "border-[var(--border-primary)] bg-[var(--bg-secondary)]"}`}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="var(--text-muted)" strokeWidth="1.3" />
                  <path d="M9 9L11.5 11.5" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search docs..."
                  className="bg-transparent text-[11px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none w-36"
                />
                <kbd className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--border-subtle)] px-1.5 py-0.5 rounded">⌘K</kbd>
              </div>

              {/* Ask AI Button */}
              <button
                onClick={() => setAiOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white text-[11px] font-mono font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 9L6 3L10 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Ask AI
              </button>

              {/* Toggle hint */}
              <div className="hidden lg:flex items-center gap-1.5 text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg">
                Toggle assistant panel
                <kbd className="text-[8px] bg-[var(--border-subtle)] px-1.5 py-0.5 rounded">⌘</kbd>
                <span>+</span>
                <kbd className="text-[8px] bg-[var(--border-subtle)] px-1.5 py-0.5 rounded">I</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Sidebar + Content + AI Panel */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="w-56 shrink-0">
          <div className="sticky top-[130px] space-y-6">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <div className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 px-2">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${
                        activeSection === item.id
                          ? "bg-[var(--accent)]/10 text-[var(--accent)] font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 min-w-0 transition-all duration-300 ${aiOpen ? "mr-[360px]" : ""}`}>
          <div className="max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] mb-6">
              <Link href="/docs" className="hover:text-[var(--accent)] transition-colors">Docs</Link>
              <span>›</span>
              <span className="text-[var(--text-primary)]">{content.title}</span>
            </div>

            <h1 className="text-[28px] font-serif font-bold text-[var(--text-primary)] mb-8 leading-tight">
              {content.title}
            </h1>

            <div className="prose-docs">
              {content.content}
            </div>

            {/* Page navigation */}
            <div className="mt-16 pt-8 border-t border-[var(--border-subtle)] flex justify-between items-center">
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                Last updated: March 2026
              </div>
              <div className="flex items-center gap-3">
                <a href="#" className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                  Edit this page →
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* AI Panel Overlay */}
        {aiOpen && (
          <div className="fixed top-[65px] right-0 w-[360px] h-[calc(100vh-65px)] bg-[var(--surface-1)] border-l border-[var(--border-subtle)] z-30 flex flex-col shadow-2xl">
            <AskAIPanel onClose={() => setAiOpen(false)} />
          </div>
        )}
      </div>

      {/* Keyboard shortcut for AI panel */}
      {/* eslint-disable-next-line */}
      <KeyboardShortcut onTrigger={() => setAiOpen((v) => !v)} />
    </div>
  );
}

function KeyboardShortcut({ onTrigger }: { onTrigger: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        onTrigger();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onTrigger]);
  return null;
}
