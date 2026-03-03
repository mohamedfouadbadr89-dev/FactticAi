'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, ArrowRight, Building2, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Auth Signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;

      // In a real app, you'd call a secure RPC or API to create the org
      // For this implementation, we assume a server-side trigger or subsequent API call handles org creation
      // since frontend shouldn't directly bypass RLS for sensitive creation.
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user?.id,
          orgName,
          fullName,
          email
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to initialize organization context.');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6 font-sans">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4 border border-[var(--accent)]/20 shadow-[0_0_30px_rgba(var(--accent-rgb),0.1)]">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[var(--text-primary)] mb-2">PROVISION ACCESS</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] tracking-widest uppercase opacity-60">Join the Facttic Governance Mesh</p>
        </div>

        <div className="section-card p-10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-8">
            {error && (
              <div className="p-4 text-xs font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error.toUpperCase()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors">
                    <UserCircle2 className="w-3 h-3" /> Identity Signature
                  </label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Alex Vance"
                    className="w-full border border-white/5 bg-white/[0.02] text-[var(--text-primary)] p-4 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-[var(--text-secondary)]">
                    <Building2 className="w-3 h-3" /> Institution Name
                  </label>
                  <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required placeholder="Facttic Heavy Industries"
                    className="w-full border border-white/5 bg-white/[0.02] text-[var(--text-primary)] p-4 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-[var(--text-secondary)]">Governance Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="analyst@facttic.ai"
                    className="w-full border border-white/5 bg-white/[0.02] text-[var(--text-primary)] p-4 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-[var(--text-secondary)]">Secure Passkey</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                    className="w-full border border-white/5 bg-white/[0.02] text-[var(--text-primary)] p-4 rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none" />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isLoading}
                className="w-full group relative overflow-hidden bg-[var(--accent)] text-white font-black uppercase tracking-[0.3em] text-[11px] px-8 py-5 rounded-2xl hover:opacity-90 transition-all shadow-[0_20px_40px_-15px_rgba(var(--accent-rgb),0.5)] active:scale-[0.98] disabled:opacity-50">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? 'Processing Telemetry...' : 'Initialize Access Profile'}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-40">
              Already have credentials? <Link href="/login" className="text-[var(--accent)] hover:underline ml-1">Authenticate Here</Link>
            </p>
          </div>
        </div>
        
        <footer className="mt-12 text-center">
          <p className="text-[9px] font-mono text-[var(--text-secondary)] opacity-30 uppercase tracking-[0.2em]">
            Institutional Grade Encryption Standards | Dual-Factor Ready
          </p>
        </footer>
      </div>
    </div>
  );
}
