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
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--surface-3)]">
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="text-mono text-[var(--text-primary)] hover:opacity-80 transition-opacity">
              Facttic.AI
            </Link>
            <p className="text-[11px] font-mono text-[var(--text-muted)] mt-3 leading-relaxed">
              Institutional AI Governance Infrastructure
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-mono text-[var(--text-muted)]">All systems operational</span>
            </div>
          </div>

          {/* Cols */}
          {footerCols.map((col) => (
            <div key={col.title}>
              <div className="text-[9px] font-mono font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">
                {col.title}
              </div>
              <div className="space-y-2.5">
                {col.links.map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    className="block text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-mono text-[var(--text-muted)] opacity-50">
            Facttic.AI © 2026 · All Rights Reserved
          </div>
          <div className="flex items-center gap-6 text-[10px] font-mono text-[var(--text-muted)] opacity-40">
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
