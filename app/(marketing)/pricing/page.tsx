import { Metadata } from "next";
import { PricingSection } from "@/components/marketing/PricingSection";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Facttic AI Governance",
  description: "Simple, transparent pricing for AI governance. Monitor voice calls and chat conversations. Starts at $49/month.",
};

const faqs = [
  {
    q: "What's included in all tiers?",
    a: "All plans include core governance infrastructure: semantic policy enforcement, deterministic audit logging, and the Facttic.AI control plane API.",
  },
  {
    q: "Can I switch tiers later?",
    a: "Yes. Tier migrations are managed by our implementation team with zero downtime and full audit continuity.",
  },
  {
    q: "Is there a trial period?",
    a: "We offer a 30-day evaluation for Governance Foundation. Contact our team to initiate an evaluation instance.",
  },
  {
    q: "What SLA do you offer?",
    a: "Governance Foundation: 99.9%. Enterprise Governance: 99.99%. Sovereign Platform: custom SLA with dedicated infrastructure.",
  },
  {
    q: "Do you support air-gapped deployments?",
    a: "Yes. The Sovereign Platform tier supports fully air-gapped deployments with hardware-root trust validation and BYOK encryption.",
  },
];

const comparisonRows = [
  { feature: "Control Plane API Access", foundation: true, enterprise: true, sovereign: true },
  { feature: "Semantic Policy Enforcement", foundation: true, enterprise: true, sovereign: true },
  { feature: "Deterministic Audit Logs", foundation: true, enterprise: true, sovereign: true },
  { feature: "Real-Time Behavioral Alerts", foundation: false, enterprise: true, sovereign: true },
  { feature: "Executive Health Indexing", foundation: false, enterprise: true, sovereign: true },
  { feature: "Multi-Tenant Isolation", foundation: false, enterprise: true, sovereign: true },
  { feature: "Air-Gapped Audit Enclaves", foundation: false, enterprise: false, sovereign: true },
  { feature: "Hardware-Root Validation", foundation: false, enterprise: false, sovereign: true },
  { feature: "BYOK Encryption Support", foundation: false, enterprise: false, sovereign: true },
  { feature: "SLA Guarantee", foundation: "99.9%", enterprise: "99.99%", sovereign: "Custom" },
  { feature: "Dedicated Support", foundation: false, enterprise: true, sovereign: true },
];

function Check({ ok }: { ok: boolean | string }) {
  if (typeof ok === "string") {
    return <span className="text-[11px] font-mono font-bold text-[var(--accent)]">{ok}</span>;
  }
  if (ok) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto">
        <circle cx="8" cy="8" r="7" fill="var(--accent)" fillOpacity="0.15" />
        <path d="M5 8l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto">
      <circle cx="8" cy="8" r="7" fill="var(--border-subtle)" fillOpacity="0.3" />
      <path d="M6 10l4-4M10 10L6 6" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 md:py-28 border-b border-[var(--border-subtle)] overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: "linear-gradient(var(--border-primary) 1px, transparent 1px), linear-gradient(90deg, var(--border-primary) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />

        <div className="max-w-[1400px] mx-auto px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[var(--border-primary)] rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest">
              Institutional Governance Tiers
            </span>
          </div>

          <h1 className="text-heading text-[var(--text-primary)] max-w-3xl mx-auto mb-6">
            Enterprise-Grade AI Governance Infrastructure
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
            Select the institutional governance framework aligned to your regulatory obligations and operational perimeter. All tiers include the full Facttic.AI control plane.
          </p>

          <div className="flex items-center justify-center gap-6 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              SOC2 Type II Certified
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              GDPR Compliant
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              HIPAA Ready
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <PricingSection />

      {/* Comparison Table */}
      <SectionWrapper
        id="comparison"
        eyebrow="Feature Matrix"
        title="Full Tier Comparison."
        description="Side-by-side view of every capability across all governance tiers."
        headerClassName="text-center mx-auto"
        showDivider
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-primary)]">
                <th className="text-left py-4 pr-8 text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest w-1/2">
                  Capability
                </th>
                {["Foundation", "Enterprise", "Sovereign"].map((tier, i) => (
                  <th key={tier} className={`text-center py-4 px-6 text-[11px] font-mono font-bold uppercase tracking-widest ${i === 1 ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                    {tier}
                    {i === 1 && (
                      <div className="mt-1 text-[9px] normal-case tracking-normal text-[var(--text-muted)]">Recommended</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr
                  key={row.feature}
                  className={`border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-secondary)]/40 ${idx % 2 === 0 ? "" : "bg-[var(--surface-1)]/20"}`}
                >
                  <td className="py-3.5 pr-8 text-[13px] font-medium text-[var(--text-secondary)]">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-6 text-center"><Check ok={row.foundation} /></td>
                  <td className="py-3.5 px-6 text-center bg-[var(--accent)]/[0.03]"><Check ok={row.enterprise} /></td>
                  <td className="py-3.5 px-6 text-center"><Check ok={row.sovereign} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionWrapper>

      {/* FAQ */}
      <SectionWrapper
        id="pricing-faq"
        eyebrow="Common Questions"
        title="Pricing FAQ."
        showDivider
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {faqs.map((item, i) => (
            <div key={i} className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-7">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">{item.q}</h3>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link href="/faq" className="text-[12px] font-mono text-[var(--accent)] hover:underline">
            View all FAQs →
          </Link>
        </div>
      </SectionWrapper>

      {/* CTA */}
      <SectionWrapper id="pricing-cta" showDivider>
        <div className="text-center py-8">
          <p className="text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-4">
            Ready to Deploy
          </p>
          <h2 className="text-heading text-[var(--text-primary)] mb-6 max-w-2xl mx-auto">
            Start Your Governance Implementation
          </h2>
          <p className="text-body text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
            Our implementation team will design a governance architecture aligned to your regulatory context and AI deployment perimeter.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-[var(--accent)] text-white text-[12px] font-mono font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
            >
              Initialize Evaluation
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3.5 border border-[var(--border-primary)] text-[var(--text-primary)] text-[12px] font-mono font-bold uppercase tracking-[0.15em] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
