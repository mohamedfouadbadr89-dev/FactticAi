export const marketingData = {
  hero: {
    eyebrow: "Governance Entry v1.0",
    title: "AI Governance Control Layer",
    description: "Enterprise Behavioral Enforcement & Audit Integrity",
    primaryCta: "Enter Executive View",
    secondaryCta: "View Governance Architecture",
    trustSignals: [],
    preview: {
      score: 94,
      rca: 99.2,
      drift: 0.8,
      org: "Facttic Institutional",
      ledgerStatus: "Sealed v1.0",
      alerts: [
        { id: "P-09", title: "Policy Violation: Access Scope", severity: "High" },
        { id: "D-04", title: "Drift Correlation Detected", severity: "Med" }
      ]
    }
  },
  executiveDashboard: {
    orgName: "Facttic Global Institutional",
    healthScore: 94.2,
    sessionCount: 1240,
    voiceCalls: 42,
    driftFrequency: 0.82,
    rcaConfidence: 99.4,
    driftTrend: [3.2, 2.8, 2.5, 2.2, 1.8, 1.4, 1.2],
    alerts: [
      { id: "P-09", title: "Policy Violation: Cross-Enclave Data Leakage", severity: "High" },
      { id: "D-04", title: "Drift Correlation: Latency Phase Shift", severity: "Med" },
      { id: "V-01", title: "Voice Authentication: Token Replay Attempt", severity: "High" }
    ],
    ledgerStatus: "Sealed & Verified",
    auditHash: "0x82...BF92"
  },
  metrics: [
    {
      label: "Attribution Accuracy",
      value: 99.9,
      suffix: "%",
      decimals: 1,
      prefix: undefined,
      sub: "Deterministic root cause"
    },
    {
      label: "Latency Overhead",
      value: 4,
      prefix: "<",
      suffix: "ms",
      decimals: undefined,
      sub: "Near-zero compute impact"
    },
    {
      label: "Governance Nodes",
      value: 52400,
      suffix: "+",
      prefix: undefined,
      decimals: undefined,
      sub: "Global edge distribution"
    },
    {
      label: "Compliance Index",
      value: 100,
      suffix: "/100",
      prefix: undefined,
      decimals: undefined,
      sub: "SOC2 + HIPAA compliant"
    },
    {
      label: "System Uptime",
      value: 99.99,
      suffix: "%",
      prefix: undefined,
      decimals: 2,
      sub: "Institutional grade SLA"
    }
  ],
  whatIs: {
    eyebrow: "Defining the Standard",
    title: "Facttic is the Institutional Layer for Generative AI.",
    description: "Generic AI tools focus on generation. Facttic focuses on governance. We provide the deterministic guardrails required for regulated enterprise production.",
    isNotItems: [
      "A creative co-pilot",
      "A stochastic chat interface",
      "A consumer-grade wrapper",
      "An unmonitored black box"
    ],
    isItems: [
      "Deterministic Governance",
      "Institutional Control Plane",
      "Root Cause Attribution",
      "Immutable Audit Protocol"
    ]
  },
  layers: {
    eyebrow: "System Architecture",
    title: "Institutional Security Layers",
    description: "The Facttic architecture is built on immutable pillars of governance, ensuring zero-trust AI operations at scale through a modular, deterministic stack.",
    items: [
      {
        id: "01",
        label: "Control Plane",
        title: "Deterministic Enforcement",
        features: [
          "Pre-inference policy validation",
          "Semantic boundary enforcement",
          "Stochastic noise suppression",
          "Protocol-level interceptors"
        ],
        modules: "12 active modules"
      },
      {
        id: "02",
        label: "Attribution",
        title: "Root Cause Architecture",
        features: [
          "Prompt-to-node mapping",
          "Behavioral drift correlation",
          "Automated RCA sequencing",
          "Data lineage tracking"
        ],
        modules: "8 active modules"
      },
      {
        id: "03",
        label: "Integrity Mesh",
        title: "Cryptographic Trust",
        features: [
          "SHA-256 policy hashing",
          "Tamper-proof audit logs",
          "End-to-end enclave security",
          "Hardware-root validation"
        ],
        modules: "15 active modules"
      },
      {
        id: "04",
        label: "Observation",
        title: "Telemetric Governance",
        features: [
          "Real-time risk attribution",
          "Executive health indexing",
          "Deterministic alerting",
          "Multi-modal telemetry"
        ],
        modules: "22 active modules"
      },
      {
        id: "05",
        label: "Integration",
        title: "Enterprise Gateway",
        features: [
          "Zero-trust API ingress",
          "Multi-provider abstraction",
          "Standardized JSON-RPC",
          "Rate-limiting governance"
        ],
        modules: "6 active modules"
      },
      {
        id: "06",
        label: "Redaction",
        title: "PII Security Layer",
        features: [
          "Automated entity masking",
          "Privacy budget control",
          "Regulated data masking",
          "Differential privacy mesh"
        ],
        modules: "9 active modules"
      }
    ]
  },
  modes: {
    eyebrow: "Stakeholder Perspectives",
    title: "Dual-Mode Governance Interface.",
    description: "Facttic serves both strategic and technical stakeholders through specialized operational lenses, ensuring alignment across the entire institution.",
    items: [
      {
        id: "executive",
        label: "Strategic Oversight",
        title: "Executive Mode",
        audience: "CFO, CLO, CISO, Board",
        description: "High-level deterministic governance for risk officers requiring aggregate health metrics and material impact analysis.",
        features: [
          "Governance Health Index",
          "Deterministic Risk Summary",
          "Compliance Snapshot (SOC2/GDPR)",
          "Economic Impact Projections",
          "Materiality Assessment"
        ]
      },
      {
        id: "advanced",
        label: "Technical Control",
        title: "Advanced Mode",
        audience: "CTO, AI Engineers, Security Teams",
        description: "Granular control plane access for security engineers requiring node-level telemetry and protocol validation.",
        features: [
          "Prompt Hashing & Integrity",
          "Drift Index Projections",
          "Regression Engine Analysis",
          "Event Telemetry (Universal Trace)",
          "Cryptographic Proof Validation"
        ]
      }
    ]
  },
  security: {
    eyebrow: "Security & Integrity",
    title: "Hardened Cryptographic Governance.",
    description: "Facttic provides a mathematically verifiable audit layer for AI deployments, ensuring that governance is not just a policy, but a technical constraint.",
    tamperStatus: {
      events: 0,
      window: "Last 30 Days",
      status: "PROTOCOL_VERIFIED"
    },
    features: [
      {
        title: "Tamper-Proof Audit Chain",
        description: "Every interaction is linked via a sequence of cryptographic hashes, creating an immutable timeline of governance decisions."
      },
      {
        title: "SHA-256 Event Hashing",
        description: "Events are uniquely identified and signed at the point of origin, ensuring data finality and non-repudiation."
      },
      {
        title: "Dual-Key BYOK Encryption",
        description: "Maintain absolute data sovereignty with Bring Your Own Key (BYOK) support, where Facttic never holds the master rotation keys."
      },
      {
        title: "Agent Version Lock",
        description: "Strict enforcement of authorized agent versions, preventing unauthorized model swaps or policy regressions."
      },
      {
        title: "Regulatory Compliance Export",
        description: "One-click generation of auditor-ready evidence packages, mapped directly to SOC2, GDPR, and HIPAA frameworks."
      }
    ],
    liveChain: [
      { id: "E-829", hash: "0x82f1...92bf", status: "VERIFIED" },
      { id: "E-830", hash: "0x33a1...bc21", status: "VERIFIED" },
      { id: "E-831", hash: "0x91e2...ff10", status: "VERIFIED" }
    ],
    auditHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    consensusRoot: "f47ac10b-58cc-4372-a567-0e02b2c3d479::root_ca_verified"
  },
  compliance: {
    eyebrow: "Regulatory Verification",
    badges: [
      "SOC2 TYPE II",
      "ISO 27001",
      "HIPAA COMPLIANT",
      "GDPR READY",
      "FEDRAMP (IN-PROCESS)",
      "PCI-DSS v4.0",
      "CCPA"
    ]
  },
  systemOverview: {
    eyebrow: "System Mechanics",
    title: "Governance Engine Architecture",
    description: "The Facttic platform operates as a deterministic interceptor layer between enterprise applications and stochastic intelligence models. It enforces policy at the protocol level, ensuring every interaction is verified against institutional constraints.",
    stats: [
      { label: "Interceptor Latency", value: "< 5ms" },
      { label: "Policy Resolution", value: "Deterministic" },
      { label: "Audit Integrity", value: "SHA-256 Verified" }
    ]
  },
  architectureMatrix: {
    eyebrow: "Operational Matrix",
    title: "Layered Governance Controls",
    description: "A modular framework for enforcing behavioral, security, and compliance protocols across the entire AI lifecycle.",
    layers: [
      { id: "L0", name: "Integrity Base", focus: "Cryptography & Hardware Root", modules: 12 },
      { id: "L1", name: "Protocol Layer", focus: "Policy Enforcement & Interceptors", modules: 24 },
      { id: "L2", name: "Telemetry Stack", focus: "Behavioral Drift & RCA", modules: 18 },
      { id: "L3", name: "Interface Mesh", focus: "Stakeholder Portals & API Gateway", modules: 8 }
    ]
  },
  complianceReadiness: {
    eyebrow: "Audit Readiness",
    title: "Institutional Protocol Snapshots",
    snapshot: {
      status: "OPTIMAL",
      lastAudit: "2026-02-28",
      frameworks: ["SOC2 Type II", "GDPR", "HIPAA", "ISO 27001", "EU AI Act"],
      evidenceNodes: 1420
    }
  },
  deploymentGrid: {
    eyebrow: "Deployment Matrix",
    title: "Enterprise Perimeter Options",
    options: [
      { name: "Public Cloud (VPC)", access: "Dedicated Instance", security: "High" },
      { name: "Sovereign Cloud", access: "Air-Gapped Optional", security: "Institutional" },
      { name: "On-Prem / Enclave", access: "Full Local Residency", security: "Maximum" }
    ]
  },
  deployment: {
    eyebrow: "Enterprise Deployment",
    title: "Deploy Facttic Inside Your Governance Perimeter.",
    description: "Flexible deployment frameworks tailored for institutional security requirements and regulatory compliance.",
    options: [
      {
        label: "CLOUD SAAS",
        description: "Standard multi-tenant governance instance managed by Facttic Engineering.",
        benefits: ["Zero maintenance overhead", "Instant feature activation", "Global edge distribution"]
      },
      {
        label: "DEDICATED VPC",
        description: "Isolated governance plane deployed within your selected cloud region.",
        benefits: ["Single-tenant isolation", "Custom ingress control", "Private network peering"]
      },
      {
        label: "SELF-HOSTED",
        description: "Containerized deployment for internal Kubernetes or managed enclaves.",
        benefits: ["Local data residency", "Infrastructure autonomy", "Internal audit oversight"]
      },
      {
        label: "AIR-GAPPED",
        description: "Specialized protocol for mission-critical regulated state systems.",
        benefits: ["Zero external egress", "Hardware-root validation", "Physical enclave security"]
      }
    ]
  },
  timeline: {
    title: "The 6 Phases of AI Governance",
    phases: [
      { id: 1, title: "Baseline Profiling", description: "Deterministic mapping of model behavioral boundaries and policy definitions." },
      { id: 2, title: "Policy Enforcement", description: "Real-time interceptors blocking interactions that violate institutional constraints." },
      { id: 3, title: "Drift Detection", description: "Automated analysis of semantic shifts and behavioral divergence in production." },
      { id: 4, title: "Risk Escalation", description: "Intelligent alerting and incident response orchestration based on risk velocity." },
      { id: 5, title: "Audit & Evidence", description: "Immutable proof generation for regulatory reporting and SOC2 compliance." },
      { id: 6, title: "Continuous Simulation", description: "Proactive threat replay systems testing governance resilience at scale." }
    ]
  },
  useCases: {
    title: "Where Governance Becomes Mission-Critical",
    items: [
      {
        title: "Banking & Financial Advisory",
        scenario: "AI agents providing automated advisory services often produce unmonitored risk exposure or fiduciary violations.",
        failure: "Without governance, stochastic model drift leads to unauthorized trade signals and significant regulatory penalties.",
        intervention: "Facttic enforces deterministic semantic boundaries, providing real-time root cause attribution for every automated signal.",
        level: "HIGH"
      },
      {
        title: "Healthcare AI Systems",
        scenario: "LLM-driven diagnostic tools risk exposing PII or providing clinically inaccurate advice in production.",
        failure: "Generic monitoring fails to catch nuance-based hallucinations that jeopardize patient safety and legal standing.",
        intervention: "Facttic enclaves redact PII pre-inference and validate all output against hard clinical policy protocols.",
        level: "HIGH"
      },
      {
        title: "Government AI Operations",
        scenario: "Critical state infrastructure requires absolute data residency and zero-trust operational oversight.",
        failure: "Reliance on standard SaaS governance exposes sovereign data to cross-tenant vulnerabilities and unauthorized access.",
        intervention: "Air-gapped Facttic nodes operate with zero external egress, ensuring 100% cryptographic audit trails locally.",
        level: "HIGH"
      }
    ]
  },
  signals: {
    items: [
      {
        label: "EU AI ACT ENFORCEMENT",
        description: "Tiered regulatory penalties for high-risk AI deployments lacking deterministic governance controls."
      },
      {
        label: "SEC AI DISCLOSURE PRESSURE",
        description: "Institutional mandates for transparent risk attribution and material impact reporting on AI systems."
      },
      {
        label: "BOARD-LEVEL RISK MANDATES",
        description: "Executive oversight requiring verifiable guardrails before AI moves from experimental to mission-critical."
      }
    ]
  },
  intelligenceLayers: {
    eyebrow: "Sovereign Architecture",
    title: "Every Intelligence Layer. One Platform.",
    description: "The Facttic governance grid provides full-spectrum operational control over the entire lifecycle of enterprise AI deployments.",
    items: [
      {
        id: "01",
        name: "Governance Core & Drift Intelligence",
        color: "var(--accent)",
        count: 14,
        modules: [
          "Semantic boundary enforcement",
          "Behavioral drift correlation",
          "Stochastic noise suppression",
          "Policy-to-prompt mapping",
          "Real-time drift alarms"
        ]
      },
      {
        id: "02",
        name: "Security & Tamper-Proof Layer",
        color: "var(--gold)",
        count: 12,
        modules: [
          "SHA-256 integrity sealing",
          "Protocol enclave execution",
          "Hardware-root validation",
          "Audit ledger finality",
          "Access scope locking"
        ]
      },
      {
        id: "03",
        name: "Enterprise Observability",
        color: "var(--blue)",
        count: 18,
        modules: [
          "Universal trace aggregation",
          "Latency phase monitoring",
          "Token economic tracking",
          "System health indexing",
          "Multi-modal telemetry"
        ]
      },
      {
        id: "04",
        name: "Compliance Intelligence",
        color: "var(--green)",
        count: 9,
        modules: [
          "EU AI Act automated audit",
          "SOC2 evidence collection",
          "GDPR privacy budgeting",
          "HIPAA data residency check",
          "SEC disclosure engine"
        ]
      },
      {
        id: "05",
        name: "Voice Governance",
        color: "var(--amber)",
        count: 11,
        modules: [
          "Biometric replay defense",
          "Acoustic policy interceptors",
          "Streaming PII redaction",
          "Voice identity verification",
          "Real-time audio audit"
        ]
      },
      {
        id: "06",
        name: "Billing & Economic Defense",
        color: "var(--red)",
        count: 7,
        modules: [
          "Spend anomaly detection",
          "Quota-based governance",
          "Revenue leakage mapping",
          "Cost-to-risk attribution",
          "Infrastructure optimization"
        ]
      },
      {
        id: "07",
        name: "Multi-Agent Control",
        color: "var(--blue)",
        count: 15,
        modules: [
          "Agent-to-agent protocol",
          "Recursive call protection",
          "Enclave identity propagation",
          "Swarm behavior limiting",
          "Inter-agent audit trails"
        ]
      },
      {
        id: "08",
        name: "Human-in-the-Loop",
        color: "var(--gold)",
        count: 6,
        modules: [
          "High-risk escalation flow",
          "Manual protocol approval",
          "Executive override enclaves",
          "Advisory board review",
          "Audit counter-signing"
        ]
      },
      {
        id: "09",
        name: "PII Redaction & Privacy Mesh",
        color: "var(--green)",
        count: 22,
        modules: [
          "Automated entity masking",
          "Differential privacy nodes",
          "Zero-trust data ingress",
          "Regional residency locking",
          "Data lineage isolation"
        ]
      },
      {
        id: "10",
        name: "System Integrity & Enclaves",
        color: "var(--navy3)",
        count: 8,
        modules: [
          "Isolated compute enclaves",
          "Memory-safe protocol runtimes",
          "Binary integrity checking",
          "Root-of-trust validation",
          "Secure sidecar injection"
        ]
      },
      {
        id: "11",
        name: "Real-time Policy Interceptors",
        color: "var(--warning)",
        count: 16,
        modules: [
          "Inline policy valuation",
          "Semantic boundary blocking",
          "Intent classification checks",
          "High-velocity rule injection",
          "Low-latency interception"
        ]
      },
      {
        id: "12",
        name: "Audit & Evidence Aggregation",
        color: "var(--accent)",
        count: 20,
        modules: [
          "Immutable proof generation",
          "SHA-256 data finality",
          "Evidence vault storage",
          "Legal-ready report export",
          "Multi-tenant audit logs"
        ]
      }
    ]
  },
  authority: {
    quote: "AI without governance is liability. AI with governance is infrastructure.",
    citation: "FACTTIC · ENTERPRISE AI GOVERNANCE PLATFORM · 2026"
  }
} as const;
