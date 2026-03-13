"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import FactticLogo from "@/components/ui/FactticLogo";

const productDropdown = [
  { href: "/#system-overview", label: "Architecture", desc: "System design & control plane" },
  { href: "/#security", label: "Security", desc: "Cryptographic audit & isolation" },
  { href: "/#compliance", label: "Compliance", desc: "SOC2, GDPR, HIPAA frameworks" },
  { href: "/#governance", label: "Governance Layers", desc: "Semantic policy enforcement" },
];

const resourcesDropdown = [
  { href: "/docs", label: "Documentation", desc: "API reference & integration guides" },
  { href: "/docs#user-guide", label: "User Guide", desc: "Getting started with Facttic.AI" },
  { href: "/blog", label: "Blog", desc: "Research, updates & insights" },
  { href: "/faq", label: "FAQ", desc: "Common questions & answers" },
];

function Dropdown({
  label,
  items,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string;
  items: { href: string; label: string; desc: string }[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => (isOpen ? onClose() : onOpen())}
        className="flex items-center gap-1 nav-link text-mono-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        aria-expanded={isOpen}
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Arrow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-[var(--bg-elevated)] border-t border-l border-[var(--border-primary)] rotate-45 z-10" />

          <div className="relative bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-2xl overflow-hidden">
            <div className="p-1.5">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex flex-col gap-0.5 px-3.5 py-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <span className="text-[12px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {item.desc}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-subtle)] backdrop-blur-md backdrop-saturate-150 bg-[var(--surface-1)]/95">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity flex items-center">
          <FactticLogo variant="horizontal" theme="auto" width={140} />
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Dropdown
            label="Platform"
            items={productDropdown}
            isOpen={open === "platform"}
            onOpen={() => setOpen("platform")}
            onClose={() => setOpen(null)}
          />

          <Dropdown
            label="Resources"
            items={resourcesDropdown}
            isOpen={open === "resources"}
            onOpen={() => setOpen("resources")}
            onClose={() => setOpen(null)}
          />

          <Link
            href="/pricing"
            className={`nav-link text-mono-xs transition-colors ${isActive("/pricing") ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          >
            Pricing
          </Link>

          <Link
            href="/blog"
            className={`nav-link text-mono-xs transition-colors ${isActive("/blog") ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
          >
            Blog
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="press-depth px-6 py-2.5 bg-[var(--accent)] text-white text-mono-xs border-none hover:opacity-90 transition-opacity"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}
