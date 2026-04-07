'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { label: 'System Configuration', href: '/dashboard/settings' },
    { label: 'Access Control', href: '/dashboard/settings/access' },
    { label: 'API Keys', href: '/dashboard/settings/api-keys' },
    { label: 'Webhooks', href: '/dashboard/settings/webhooks' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-[var(--text-primary)]">
          Governance Settings
        </h1>
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          Manage deterministic parameters, institutional access, and external telemetry bindings.
        </p>
      </header>

      <nav className="flex items-center gap-8 border-b border-[var(--border-primary)] pb-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative pb-3 text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${
                isActive 
                  ? 'text-[var(--accent)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <main className="pt-4">
        {children}
      </main>
    </div>
  );
}
