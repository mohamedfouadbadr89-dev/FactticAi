'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSsoLoading, setIsSsoLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleSsoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSsoLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate SSO');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      setIsSsoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
      <div className="w-full max-w-md section-card p-8 rounded-2xl shadow-xl">
        <div className="mb-8 text-center border-b border-[var(--border-primary)] pb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">Log In</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Access the Governance Terminal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-[var(--text-secondary)]">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@facttic.ai"
                className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-3 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-[var(--text-secondary)]">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-3 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>
          <button type="submit" disabled={isLoading || isSsoLoading}
            className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-[var(--border-primary)] after:mt-0.5 after:flex-1 after:border-t after:border-[var(--border-primary)]">
          <p className="mx-4 mb-0 text-center text-sm font-semibold text-[var(--text-secondary)]">OR</p>
        </div>

        <form onSubmit={handleSsoSubmit} className="space-y-4">
          <div>
             <label htmlFor="domain" className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-[var(--text-secondary)]">Enterprise Domain</label>
             <input id="domain" type="text" value={domain} onChange={(e) => setDomain(e.target.value)} required placeholder="acme.com"
                className="w-full border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-3 rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
          </div>
          <button type="submit" disabled={isLoading || isSsoLoading}
            className="w-full border border-[var(--border-primary)] text-[var(--text-primary)] font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-lg hover:border-[var(--accent)] transition-colors disabled:opacity-50">
            {isSsoLoading ? 'Redirecting to IdP...' : 'Enterprise Login (SSO)'}
          </button>
        </form>
          
        <div className="text-center pt-6 mt-6 border-t border-[var(--border-primary)]">
          <a href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            Recover Credentials
          </a>
        </div>
      </div>
    </div>
  );
}
