"use client";

import React from 'react';
import Link from 'next/link';

const footerCols = [
  {
    title: "Platform",
    links: [
      { href: "/#system-overview", label: "Architecture" },
      { href: "/#security", label: "Security" },
      { href: "/#compliance", label: "Compliance" },
      { href: "/#governance", label: "Governance Layers" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs#api-reference", label: "API Reference" },
      { href: "/blog", label: "Blog" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/login", label: "Dashboard" },
      { href: "/login", label: "Sign In" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--surface-1)", borderTop: "1px solid var(--border-subtle)" }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.02em", textDecoration: "none" }}
              className="hover:opacity-80 transition-opacity"
            >
              Facttic.AI
            </Link>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 12, lineHeight: 1.5 }}>
              Institutional AI Governance Infrastructure
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--text-muted)" }}>All systems operational</span>
            </div>
          </div>

          {/* Cols */}
          {footerCols.map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>
                {col.title}
              </div>
              <div className="space-y-2.5">
                {col.links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.12s" }}
                    className="hover:text-[#C9A84C]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ paddingTop: 32, borderTop: "1px solid var(--border-subtle)" }}
        >
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            Facttic.AI © 2026 · All Rights Reserved
          </div>
          <div className="flex items-center gap-6" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            <span>SHA-256 Verified</span>
            <span>·</span>
            <span>SOC2 Type II</span>
            <span>·</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
