# Full System Technical Documentation: Facttic AI

## 1. System Identity

- **What the system is:** Facttic AI is an enterprise-grade AI Governance, Risk Analysis, and Compliance platform.
- **What problem it solves:** It provides deterministic auditing, risk scoring, and policy drift detection for AI-generated text and voice conversations at scale, ensuring LLM applications remain compliant, secure, and performant.
- **Type of platform:** B2B SaaS API Platform & Dashboard.
- **Core purpose:** To ingest high-volume telemetry from voice and chat AI agents (like Vapi, ElevenLabs, Retell, OpenAI, Anthropic), deterministically evaluate them for risk (hallucinations, PII exposure, context drift, unsafe tone), and provide executive reporting and actionable alerts.

---

## 2. System Architecture

The project follows a modern, serverless, edge-ready architecture.

- **Frontend framework:** Next.js 16 (App Router) combined with React 19.
- **Styling:** Tailwind CSS v4 with PostCSS.
- **Backend framework:** Next.js API Routes (Serverless edge functions).
- **Service architecture:** Monolithic structure utilizing a modular pipeline pattern (`GovernancePipeline`) that standardizes the ingestion, evaluation, and storage flow.
- **Data persistence:** PostgreSQL hosted on Supabase, leveraging deep Row-Level Security (RLS) for multi-tenancy.
- **Caching & Rate Limiting:** Redis (via `ioredis`) for idempotency, rate-limiting, and high-speed data caching.
- **Queueing / async processing:** Fast, synchronous pipeline returns paired with asynchronous background archiving and replication (via `setImmediate` and `webhookQueue.ts`).
- **Architectural patterns used:**
  - **Pipeline Pattern:** Centralized data flow via `GovernancePipeline.ts` passing `PipelineContext`.
  - **Controllers:** Standalone Next.js Route Handlers in `app/api/*` acting as REST endpoints.
  - **Services / Engines:** Heavily encapsulated domain logic classes (`PredictiveEngine`, `RiskScoringEngine`).
  - **Higher-Order Components (HOC) / Middleware:** Next.js native Route Middlewares & explicit `authorize()` RBAC decorators.

---

## 3. Core Engines

The system abstracts heavy computational rulesets into deterministic, standalone "Engines."

### A. Governance Pipeline Engine
- **Purpose:** The central orchestrator unifying Auth, Idempotency, Risk Scoring, Billing, and Telemetry into a tight performance budget (<150ms).
- **Files:** `/lib/governancePipeline.ts`
- **Inputs:** `PipelineContext` (payload, orgId, provider).
- **Outputs:** `GovernanceExecutionResult` (success, latency, integrityHash).

### B. Risk Scoring Engine
- **Purpose:** Evaluates specific conversational turns using a deterministic, pure-function weighted matrix to score hallucination, tone, context drift, and response confidence.
- **Files:** `/lib/riskScoringEngine.ts`, `/lib/riskTypes.ts`
- **Inputs:** Conversation payload and metadata.
- **Outputs:** `TurnRiskScore`.

### C. Predictive Engine (Tier 2)
- **Purpose:** Deterministic signal analysis calculating statistical drift. Projects Governance anomalies and flags billing/velocity spikes.
- **Files:** `/lib/predictiveEngine.ts`
- **Inputs:** Organization ID, Historical/Current Baselines.
- **Outputs:** `RiskProfile` (OPTIMAL, WARNING, CRITICAL).

### D. Advanced Intelligence Engine
- **Purpose:** Heuristic and Regex-driven pattern matching for exposing Deep PII (Credit Cards, SSNs, IPv4, Passports, Phone Numbers) and measuring compliance drift. 
- **Files:** `/src/engines/AdvancedIntelligence.ts`
- **Outputs:** Redacted Conversations and Compliance Metrics.

### E. Replication Engine
- **Purpose:** Handles asynchronous read-only replication across regions mapping the Evidence Bundles securely.
- **Files:** `/lib/replicationEngine.ts`

---

## 4. API Surface

The API surface spans internal system metrics, governance execution, and webhook ingestion. (Note: 55+ distinct endpoints are active in `/app/api`).

**Key Domains:**
- **`/app/api/webhooks/voice` (POST):** Ingests standardized payloads. Normalizes Vapi, Retell, Pipecat, and ElevenLabs APIs via `conversationUtils.ts`.
- **`/app/api/governance/evaluate` (POST):** The core external RPC triggering the `GovernancePipeline` for programmatic text evaluation.
- **`/app/api/auth/sso/route.ts` (GET/POST):** Identity Provider redirects targeting Okta/SAML integrations.
- **`/app/api/cron/health/route.ts` (GET):** Multi-region system pinging scaling dynamic cluster health.
- **`/api/internal/metrics/prometheus` (GET):** Telemetry scraping route for active DB connections and latencies.

## 5. Authentication System

The application employs an enterprise-grade Auth layer prioritizing deep Multi-tenant isolation.
- **Auth Method:** Supabase SSR Auth mapping standard JWT Bearer tokens alongside Enterprise SSO integrations (via `/lib/ssoMapper.ts`).
- **Session Handling:** `localStorage` bridging for frontend client-side tracking (`/lib/auth.ts`) mapped against secure `http-only` cookies natively provided by `@supabase/ssr`.
- **RBAC (Role-Based Access Control):** Defined strictly in `/lib/rbac.ts` establishing deterministic matrices for `owner` > `admin` > `analyst` > `viewer`.
- **Security Additions:** "Bring-Your-Own-Key" (BYOK) AES-256 validation enforced mechanically at the webhook routers.

---

## 6. Dashboard & UI

- **Pages:** Modular directories under `app/dashboard/` (e.g., Settings, Webhooks, Governance, Telemetry).
- **Components:** Found deeply nested in `/components/*`. Includes modular React data visualizations integrating `recharts` for timeseries risk mapping.
- **Executive Layer:** Read-only compliance roll-ups aimed at executive auditing contrasting the granular "Command Center" operational views.
- **Functionality:** Real-time risk attribution viewing, live Server-Sent Events (SSE) telemetry tables, Tenant specific configuration portals mapping hierarchical JSONB.

---

## 7. Data Layer

- **Database:** PostgreSQL (Hosted natively on Supabase).
- **ORM / Client:** `@supabase/supabase-js`.
- **Schema & Migrations:** Explicit SQL versioning maintained in `/supabase/migrations/`.
  - Core structures: `organizations`, `voice_conversations`, `chat_conversations`, `voice_risk_scores`, `tenant_configs`, `governance_predictions`.
- **Row-Level Security (RLS):** Extensive PostgreSQL policies explicitly binding tables natively to the `auth.uid()` / `org_id` context preventing multi-tenant bleeding.
- **Caching Layer:** High-throughput `ioredis` bindings executing Rate-Limits and `recordWebhookEvent` idempotency checks.

---

## 8. Integrations

The system is highly interoperable mapping directly to multiple distinct SaaS boundaries:
- **Voice Integrations:** Vapi, Retell, ElevenLabs, Twilio, Pipecat.
- **Chat Integrations:** OpenAI, Anthropic conversational boundaries.
- **Telemetry / Ops:** Datadog, ELK stack log pipelines, Sentry (`@sentry/nextjs`), Prometheus Scraping.
- **Authentication:** Native Provider SSO (Okta, Azure AD).

---

## 9. Background Processing

- **Schedulers / Cron:** Built-in Vercel/NextJS Cron implementations targeting `/app/api/cron/*`. Trigger events for stale data pruning and scheduled compliance package generation.
- **Asynchronous Chains:** Heavy pipeline paths (Event replication, Risk Archiving) map to `setImmediate()` blocks ensuring Webhook ingestion resolves within `< 200ms` bounds while db-inserts trigger invisibly in background processes.

---

## 10. Security

Extremely mature security posture explicitly defending against OWASP Top 10 vulnerabilities.
- **Input Validation (XSS):** Native `detectXSS` heuristic recursion engines spanning ALL webhook parameters rejecting strings containing `<script>`, `javascript:`, or malicious onload injection hooks.
- **HTTP Headers:** Immutable CSP (Content Security Policy), HSTS, and X-Frame-Options mapped universally via `next.config.mjs`.
- **Cryptographic Control:** AES-256 BYOK integrations enabling Enterprise customers to manage keys offline entirely.
- **Dependency Auditing:** Squeaky clean NPM registries patching native Webpack CVEs resulting in exactly `0 vulnerabilities` post-launch.

---

## 11. Feature Map

- **Real-time Conversation Ingestion:** Voice & Chat translation layers.
- **Zero-Knowledge Encryption Pipeline:** Decrypting streams securely utilizing BYOK implementations.
- **Deterministic Risk Scoring:** Rule-based algorithm asserting LLM Hallucinations, Sentiment, and Policy Drift accurately.
- **PII Exposure Redaction:** Native logic stripping SSNs, Phone numbers, and Passports from transcripts.
- **Timeseries Predictive Analysis:** Calculating the Governance 'Health' indices proactively projecting institutional risk boundaries.
- **Enterprise Self-Service Settings:** Org-specific webhook configs and role management mappings.
- **Compliance & Evidence Exports:** Immutable read-only Audit logs mapping explicit compliance hashes for SOC2 investigations.

---

## 12. File Map (Notable Files)

- `/lib/governancePipeline.ts` → The orchestrator managing Request routing, Billing, Integrity Hashing, and Async Risk firing.
- `/lib/riskScoringEngine.ts` → Pure deterministic text-analysis and turn-evaluation mathematical engine.
- `/src/engines/AdvancedIntelligence.ts` → The Regex boundary masking Deep-PII injections prior to DB insertion.
- `/src/utils/conversationUtils.ts` → Normalizer breaking down disparate Vapi/Retell JSON constructs into standard `VoiceConversation` models containing `detectXSS` middleware.
- `/cypress/e2e/voiceWebhooks.cy.js` → Comprehensive Production-parity UI and API integration flow mapping.
- `/next.config.mjs` → Webpack configurations locking external data bounds and injecting CSP headers definitively.
- `docs/TELEMETRY_DASHBOARDS.md` → The playbook defining the operational SRE thresholds mapped natively to ELK/Prometheus scraping metrics.

---

## 13. Current System Capabilities (v1.0 Production Readiness)

The platform is certified for enterprise availability. It maintains the physical capability to securely ingest 600 concurrent voice connections simultaneously while providing a centralized **AI Traffic Gateway** for unified LLM governance. Its strongest capability resides in its `GovernancePipeline.ts` and the new `AiGateway.ts`—a uniquely optimized performance loop that successfully decouples fast ingestion and routing away from deep, heavy compliance operations mapping deterministically.

**Target Demographics:**
The B2B structures created natively (BYOK, RLS Isolation, SAML SSO, PII Redaction) position Facttic to serve strictly-regulated sectors containing immense risk vulnerabilities natively including:
- **Finance & Banking Sector** (Reg D / SOC2 auditing).
- **Healthcare Applications** (HIPAA compliance, PII/PHI redaction mapping).
- **Insurance Underwriting AI** (Mitigating LLM Tone/Sentiment deviations in policy pricing calls).
