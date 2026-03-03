'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const PATH_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'analysis': 'Intelligence',
  'alerts': 'Alert Guardrails',
  'investigations': 'Investigations',
  'reports': 'Reports',
  'advanced': 'Advanced Queries',
  'settings': 'Settings',
  'integrations': 'Integrations',
  'access': 'Access Control',
  'profile': 'Identity Profile'
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  // Skip rendering on root or plain /dashboard
  if (!pathname || pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs font-medium text-[var(--text-secondary)] px-6 py-4 pb-0" aria-label="Breadcrumb">
      <Link 
        href="/dashboard" 
        className="hover:text-white transition-colors flex items-center gap-1.5"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {segments.map((segment, index) => {
        // Skip root 'dashboard' as we show icon, unless it's the only thing
        if (segment === 'dashboard' && index === 0) return null;

        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            {isLast ? (
              <span className="text-white font-bold tracking-wide" aria-current="page">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-white transition-colors tracking-wide">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
