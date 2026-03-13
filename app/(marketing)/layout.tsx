import { Metadata } from "next";
import "../marketing.css";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Facttic.AI — Institutional AI Governance Platform",
  description:
    "Deterministic governance infrastructure for enterprise AI systems. Real-time risk attribution, behavioral enforcement, and cryptographic audit integrity for regulated production environments.",
  openGraph: {
    title: "Facttic.AI — Institutional AI Governance Platform",
    description:
      "Deterministic control, risk attribution, and policy enforcement for production AI systems.",
    url: "https://facttic.ai",
    siteName: "Facttic.AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Facttic.AI — Institutional AI Governance",
    description:
      "Deterministic governance infrastructure for enterprise AI systems.",
    creator: "@facttic_ai",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "https://facttic.ai",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Facttic.AI",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Cloud",
  url: "https://facttic.ai",
  description:
    "Institutional-grade AI governance platform providing deterministic behavioral enforcement, real-time risk attribution, and cryptographic audit integrity for regulated enterprise environments.",
  offers: {
    "@type": "Offer",
    category: "Enterprise",
    availability: "https://schema.org/OnlineOnly",
  },
  publisher: {
    "@type": "Organization",
    name: "Facttic.AI",
    url: "https://facttic.ai",
  },
  featureList: [
    "Deterministic Policy Enforcement",
    "Real-Time Risk Attribution",
    "Cryptographic Audit Chain",
    "Governance Health Indexing",
    "SOC2/GDPR/HIPAA Compliance",
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col bg-[var(--surface-0)] text-[var(--text-primary)]">
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
