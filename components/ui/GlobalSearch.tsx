'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, FileText, Bell, Shield, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SEARCH_ROUTES = [
  { title: 'Intelligence Dashboard', href: '/dashboard/analysis', icon: Shield, category: 'Governance' },
  { title: 'Executive Overview', href: '/dashboard', icon: Command, category: 'Governance' },
  { title: 'Alert Guardrails', href: '/dashboard/alerts', icon: Bell, category: 'Analytics' },
  { title: 'Generate Reports', href: '/dashboard/reports', icon: FileText, category: 'Analytics' },
  { title: 'System Settings', href: '/dashboard/settings', icon: Settings, category: 'System' },
  { title: 'API Integrations', href: '/dashboard/settings/integrations', icon: Command, category: 'System' },
  { title: 'Access Control', href: '/dashboard/settings/access', icon: Shield, category: 'System' },
  { title: 'Identity Profile', href: '/dashboard/profile', icon: User, category: 'Identity' },
];

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredRoutes = SEARCH_ROUTES.filter(route => 
    route.title.toLowerCase().includes(query.toLowerCase()) || 
    route.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)] transition-all w-64 group"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search commands...</span>
        <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] group-hover:border-[var(--accent)] transition-colors">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-primary)] rounded-lg transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Search Palette */}
          <div className="relative w-full max-w-xl bg-[var(--card-bg)] border border-[var(--active-border)] shadow-2xl rounded-2xl overflow-hidden animate-[slideDown_.2s_ease-out]">
            <div className="flex items-center px-4 py-3 border-b border-[var(--border-primary)]">
              <Search className="w-5 h-5 text-[var(--text-secondary)]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Where to?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none px-4 text-white text-lg placeholder-[var(--text-secondary)]"
              />
              <kbd className="hidden sm:inline-flex font-mono text-[10px] text-[var(--text-secondary)] px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                ESC
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredRoutes.map((route, i) => {
                    const Icon = route.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(route.href)}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[var(--bg-primary)] hover:text-[var(--accent)] transition-colors text-left group"
                      >
                        <div className="p-2 rounded-lg bg-[var(--bg-secondary)] group-hover:bg-[var(--accent)]/10 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="font-bold text-white text-sm">{route.title}</span>
                          <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{route.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
