import { Metadata } from "next";
import Link from "next/link";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";

export const metadata: Metadata = {
  title: "Blog — Facttic.AI",
  description: "Research, product updates, and insights on AI governance from the Facttic.AI team.",
};

const featured = {
  slug: "deterministic-governance-2026",
  category: "Research",
  date: "March 10, 2026",
  readTime: "8 min read",
  title: "Why Deterministic Governance Is the Only Safe Path for Enterprise AI",
  excerpt:
    "Probabilistic guardrails fail under adversarial pressure. This paper argues that cryptographically-verifiable, deterministic policy enforcement is the only governance model that can meet enterprise regulatory obligations at scale.",
  author: { name: "Governance Research Team", role: "Facttic.AI" },
};

const posts = [
  {
    slug: "soc2-ai-governance",
    category: "Compliance",
    date: "Feb 28, 2026",
    readTime: "5 min read",
    title: "SOC2 Type II Certification for AI Systems: What Auditors Actually Want",
    excerpt: "Breaking down what SOC2 auditors look for in AI-integrated systems and how to prepare your governance infrastructure.",
    author: "Compliance Engineering",
  },
  {
    slug: "behavioral-drift-detection",
    category: "Engineering",
    date: "Feb 14, 2026",
    readTime: "6 min read",
    title: "Detecting Behavioral Drift in Production LLMs Before It Becomes a Liability",
    excerpt: "How Facttic.AI's drift detection engine identifies statistical anomalies in AI output distributions to surface risks before incidents occur.",
    author: "Platform Engineering",
  },
  {
    slug: "hipaa-ai-deployment",
    category: "Compliance",
    date: "Jan 30, 2026",
    readTime: "4 min read",
    title: "HIPAA-Compliant AI Deployment: A Governance Checklist",
    excerpt: "A practical checklist for healthcare organizations deploying AI systems under HIPAA obligations.",
    author: "Healthcare Governance Team",
  },
  {
    slug: "governance-execution-architecture",
    category: "Engineering",
    date: "Jan 17, 2026",
    readTime: "9 min read",
    title: "Architecture of a Sub-50ms Governance Pipeline",
    excerpt: "How we built the Facttic.AI execution layer to enforce governance policies at inference time without meaningful latency overhead.",
    author: "Platform Engineering",
  },
  {
    slug: "executive-health-index",
    category: "Product",
    date: "Jan 5, 2026",
    readTime: "3 min read",
    title: "Introducing the Executive Health Index",
    excerpt: "A single governance score derived from behavioral compliance, drift velocity, alert frequency, and policy coverage — designed for C-suite accountability.",
    author: "Product Team",
  },
  {
    slug: "sovereign-platform-launch",
    category: "Product",
    date: "Dec 20, 2025",
    readTime: "3 min read",
    title: "Sovereign Platform: Air-Gapped Governance for Critical Infrastructure",
    excerpt: "Announcing dedicated governance enclaves for air-gapped state systems and critical infrastructure operators.",
    author: "Product Team",
  },
];

const categoryColors: Record<string, string> = {
  Research: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  Compliance: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  Engineering: "text-green-400 bg-green-400/10 border-green-400/20",
  Product: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20",
};

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-[var(--border-subtle)]">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-mono text-[var(--accent)] mb-4">Facttic.AI Blog</div>
          <h1 className="text-heading text-[var(--text-primary)] max-w-2xl mb-4">
            Research, Updates & Governance Insights
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-2xl">
            Technical deep-dives, compliance guidance, and product announcements from the Facttic.AI team.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <SectionWrapper id="featured" eyebrow="Featured" showDivider={false}>
        <Link href={`/blog/${featured.slug}`} className="block group">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-10 md:p-14 hover:border-[var(--accent)]/40 transition-all duration-300 hover:-translate-y-[2px]">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${categoryColors[featured.category]}`}>
                    {featured.category}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{featured.date}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">·</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{featured.readTime}</span>
                </div>

                <h2 className="text-[24px] md:text-[30px] font-serif font-bold text-[var(--text-primary)] leading-tight mb-5 group-hover:text-[var(--accent)] transition-colors">
                  {featured.title}
                </h2>

                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-8 max-w-2xl">
                  {featured.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-[var(--text-primary)]">{featured.author.name}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{featured.author.role}</div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[var(--accent)] group-hover:translate-x-1 transition-transform inline-block">
                    Read Article →
                  </span>
                </div>
              </div>

              {/* Abstract visualization */}
              <div className="w-full md:w-64 h-40 md:h-auto shrink-0 bg-[var(--surface-3)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full p-6 flex flex-col justify-center gap-2">
                  {[0.9, 0.6, 0.75, 0.4, 0.85].map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="text-[8px] font-mono text-[var(--text-muted)] w-6">T+{i}</div>
                      <div className="flex-1 bg-[var(--border-subtle)] rounded-full h-1.5">
                        <div
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${v * 100}%`, opacity: 0.6 + v * 0.4 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </SectionWrapper>

      {/* Post Grid */}
      <SectionWrapper id="posts" eyebrow="All Articles" showDivider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
              <article className="h-full bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl p-7 flex flex-col hover:border-[var(--accent)]/40 hover:-translate-y-[2px] transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${categoryColors[post.category]}`}>
                    {post.category}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug mb-3 group-hover:text-[var(--accent)] transition-colors flex-1">
                  {post.title}
                </h3>

                <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-subtle)]">
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{post.author}</div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </SectionWrapper>

      {/* Newsletter CTA */}
      <SectionWrapper id="newsletter" showDivider>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl p-10 md:p-14 text-center max-w-3xl mx-auto">
          <div className="text-[10px] font-mono font-bold text-[var(--accent)] uppercase tracking-widest mb-4">
            Stay Current
          </div>
          <h2 className="text-[24px] font-serif font-bold text-[var(--text-primary)] mb-4">
            Governance Intelligence Digest
          </h2>
          <p className="text-[13px] text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
            Monthly research summaries, regulatory updates, and product announcements for governance teams.
          </p>
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="institutional@organization.com"
              className="flex-1 px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-primary)] text-[12px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors rounded-lg"
            />
            <button className="px-6 py-3 bg-[var(--accent)] text-white text-[11px] font-mono font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-[9px] font-mono text-[var(--text-muted)] mt-4 opacity-60">
            No spam. Unsubscribe anytime. Institutional addresses only.
          </p>
        </div>
      </SectionWrapper>
    </>
  );
}
