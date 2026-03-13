"use client";

import React from 'react';
import Link from 'next/link';

const footerLinks = [
  { href: "/#platform", label: "Platform" },
  { href: "/#governance", label: "Governance Layers" },
  { href: "/#security", label: "Security Architecture" },
  { href: "/#compliance", label: "Compliance Center" },
  { href: "/#pricing", label: "Platform Tiers" },
  { href: "/#docs", label: "Documentation" }
];

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--surface-3)]">
      {/* Institutional Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />

      <div className="max-w-[1400px] mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Navigation */}
          <nav className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 order-1 md:order-1">
            {footerLinks.map((link, i) => (
              <Link 
                key={i} 
                href={link.href} 
                className="footer-link text-mono-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-mono-xs text-[var(--text-muted)] opacity-60 order-2 md:order-2">
            Facttic.AI © 2026 · All Rights Reserved
          </div>
        </div>

        {/* Bottom Separator */}
        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-mono-xs text-[var(--text-muted)] opacity-40">
              Institutional AI Governance · SHA-256 Verified · SOC2 Type II
            </div>
            <div className="text-mono-xs text-[var(--text-muted)] opacity-40">
              v1.0.0
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
