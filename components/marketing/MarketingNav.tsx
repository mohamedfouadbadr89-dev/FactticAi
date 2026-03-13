"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";

const navLinks = [
  { href: "#hero", label: "Overview" },
  { href: "#system-overview", label: "Architecture" },
  { href: "#security", label: "Security" },
  { href: "#compliance", label: "Compliance" },
  { href: "#pricing", label: "Platform Tiers" },
];

export function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] backdrop-blur-md backdrop-saturate-150 bg-[var(--surface-1)]/95">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-mono text-[var(--text-primary)]">
          Facttic.AI
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-link text-mono-xs text-[var(--text-muted)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="press-depth px-6 py-2.5 bg-[var(--accent)] text-white text-mono-xs border-none hover:opacity-90 transition-opacity"
          >
            Access Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
