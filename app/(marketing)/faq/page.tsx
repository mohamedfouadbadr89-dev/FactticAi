"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";

const categories = ["All", "Platform", "Compliance", "Security", "Pricing", "Technical"];

const faqs = [
  // Platform
  {
    category: "Platform",
    q: "What is Facttic.AI?",
    a: "Facttic.AI is an institutional-grade AI governance platform that sits between your application and your AI provider. It enforces semantic policies, logs every interaction cryptographically, and provides real-time behavioral oversight — all without meaningful latency overhead.",
  },
  {
    category: "Platform",
    q: "How does Facttic.AI integrate with existing AI deployments?",
    a: "Facttic.AI operates as a governance proxy. You route your AI API calls through /api/governance/execute, which intercepts, evaluates, and logs each request before forwarding to your target model. No changes to your AI provider setup are required.",
  },
  {
    category: "Platform",
    q: "What latency overhead does governance enforcement add?",
    a: "Our governance execution pipeline operates at sub-50ms latency under typical workloads. Sovereign Platform deployments with hardware-root validation may add up to 10ms additional evaluation time.",
  },
  {
    category: "Platform",
    q: "Can Facttic.AI govern multiple AI models across different providers?",
    a: "Yes. Facttic.AI is model-agnostic and provider-agnostic. You can govern GPT-4, Claude, Gemini, and custom fine-tuned models through a single governance layer with unified policy definitions.",
  },
  // Compliance
  {
    category: "Compliance",
    q: "What compliance frameworks does Facttic.AI support?",
    a: "Facttic.AI provides out-of-the-box compliance mapping for SOC2 Type II, GDPR, HIPAA, ISO 27001, and NIST AI RMF. Compliance signals are continuously monitored and surfaced in the Executive Dashboard.",
  },
  {
    category: "Compliance",
    q: "Is Facttic.AI itself SOC2 Type II certified?",
    a: "Yes. Facttic.AI infrastructure is SOC2 Type II certified. Certification documentation is available under NDA for enterprise evaluation processes.",
  },
  {
    category: "Compliance",
    q: "How does the audit chain work?",
    a: "Every governance decision produces a SHA-256 hash of the request, context, policy evaluation, and outcome. These are written to the immutable evidence ledger (facttic_governance_events table) and cannot be altered retroactively.",
  },
  {
    category: "Compliance",
    q: "Can we use Facttic.AI for HIPAA-covered AI deployments in healthcare?",
    a: "Yes. Facttic.AI supports HIPAA-compliant deployments with PII/PHI redaction at the governance layer, preventing sensitive data from reaching AI models or being stored in logs. Healthcare BAAs are available on the Enterprise and Sovereign tiers.",
  },
  // Security
  {
    category: "Security",
    q: "How are API keys secured?",
    a: "API keys are stored as bcrypt-hashed values in our database. Plaintext keys are only visible once at creation time. All key operations are logged in the governance audit chain.",
  },
  {
    category: "Security",
    q: "What is the Sovereign Platform tier?",
    a: "The Sovereign Platform provides dedicated governance enclaves for air-gapped or critical-state deployments. It includes hardware-root trust validation, BYOK (Bring Your Own Key) encryption support, and fully isolated compute infrastructure.",
  },
  {
    category: "Security",
    q: "Does Facttic.AI support multi-tenant isolation?",
    a: "Yes. Every org's data is fully isolated at the database level. All queries are scoped by org_id, and our infrastructure enforces tenant isolation at the network level as well.",
  },
  // Pricing
  {
    category: "Pricing",
    q: "How is pricing structured?",
    a: "Facttic.AI offers three institutional tiers: Governance Foundation (enterprise entry), Enterprise Governance (managed implementation), and Sovereign Platform (custom protocol). Pricing is usage-based within each tier with annual contracts for enterprise customers.",
  },
  {
    category: "Pricing",
    q: "Is there a free trial or evaluation period?",
    a: "We offer a 30-day evaluation for the Governance Foundation tier. Contact our team to initiate a scoped evaluation instance with your specific compliance context.",
  },
  {
    category: "Pricing",
    q: "Can we switch tiers after deployment?",
    a: "Yes. Tier migrations are handled by our implementation team with zero downtime and full audit continuity. Downgrading tiers may require a policy review.",
  },
  // Technical
  {
    category: "Technical",
    q: "What programming languages does the SDK support?",
    a: "Facttic.AI provides official SDKs for TypeScript/JavaScript, Python, and Go. REST API access is available for all other languages.",
  },
  {
    category: "Technical",
    q: "What is the Governance Health Index?",
    a: "The Governance Health Index is a composite score (0–100) derived from behavioral compliance rate, drift velocity, alert frequency, policy coverage, and incident resolution time. It provides executive-level visibility into your AI governance posture.",
  },
  {
    category: "Technical",
    q: "How does behavioral drift detection work?",
    a: "Facttic.AI monitors the statistical distribution of AI outputs over time using sliding-window analysis. When output patterns deviate from baseline governance profiles beyond configurable thresholds, drift alerts are triggered automatically.",
  },
];

function FaqItem({ q, a, category }: { q: string; a: string; category: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border border-[var(--border-primary)] rounded-xl overflow-hidden transition-all duration-200 ${open ? "bg-[var(--bg-elevated)]" : "bg-[var(--surface-0)] hover:bg-[var(--bg-secondary)]"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-6 px-7 py-5 text-left"
        aria-expanded={open}
      >
        <span className={`text-[14px] font-semibold leading-snug transition-colors ${open ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
          {q}
        </span>
        <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${open ? "border-[var(--accent)] bg-[var(--accent)] rotate-45" : "border-[var(--border-primary)]"}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2V8M2 5H8" stroke={open ? "white" : "var(--text-muted)"} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="px-7 pb-6">
          <div className="h-px bg-[var(--border-subtle)] mb-5" />
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-[var(--border-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <div className="text-mono text-[var(--accent)] mb-4">F&Q</div>
          <h1 className="text-heading text-[var(--text-primary)] max-w-2xl mx-auto mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto">
            Answers to common questions about the Facttic.AI governance platform, compliance frameworks, and implementation.
          </p>
        </div>
      </section>

      <SectionWrapper id="faq" showDivider={false}>
        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-[11px] font-mono font-semibold rounded-lg border transition-all ${
                activeCategory === cat
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)]">
            {filtered.length} question{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3 mt-2">
          {filtered.map((faq, i) => (
            <FaqItem key={i} {...faq} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 p-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl text-center">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">
            Still have questions?
          </p>
          <p className="text-[12px] text-[var(--text-muted)] mb-6">
            Our implementation team is available for institutional inquiries and compliance consultations.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/docs"
              className="px-6 py-2.5 border border-[var(--border-primary)] text-[11px] font-mono font-bold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors rounded-lg"
            >
              Read Documentation
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-[var(--accent)] text-white text-[11px] font-mono font-bold hover:opacity-90 transition-opacity rounded-lg"
            >
              Contact Implementation Team
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
