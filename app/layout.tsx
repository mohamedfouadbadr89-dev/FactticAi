import { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex-sans",
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-plex-serif",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Facttic.AI | Institutional Standard for AI Governance",
  description: "The global standard for deterministic AI governance, real-time risk attribution, and policy enforcement for regulated production environments.",
  keywords: ["AI Governance", "Deterministic AI", "Risk Attribution", "Enterprise AI Security", "LLM Monitoring"],
  openGraph: {
    title: "Facttic.AI | Institutional AI Governance",
    description: "Deterministic control for production AI systems.",
    type: "website",
    url: "https://facttic.ai",
  },
  alternates: {
    canonical: "https://facttic.ai",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`theme-dark ${plexSans.variable} ${plexSerif.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Facttic.AI",
              "url": "https://facttic.ai",
              "description": "Institutional Standard for AI Governance",
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var d = document.documentElement;
                var t = localStorage.getItem('facttic-theme');
                if (t === 'light') {
                  d.classList.remove('theme-dark');
                  d.classList.add('theme-light');
                } else {
                  d.classList.remove('theme-light');
                  d.classList.add('theme-dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="antialiased text-[var(--text-primary)] bg-[var(--surface-0)]">
        {children}
      </body>
    </html>
  );
}