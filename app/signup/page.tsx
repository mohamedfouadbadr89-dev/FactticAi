'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, Building2, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import FactticLogo from '@/components/ui/FactticLogo';

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

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

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
          <div className="flex justify-center mb-6">
            <FactticLogo variant="horizontal" theme="auto" width={160} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[var(--text-primary)] mb-2">PROVISION ACCESS</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] tracking-widest uppercase opacity-60">Join the Facttic Governance Mesh</p>
        </div>

        <div className="section-card p-10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-all text-sm font-semibold text-[var(--text-primary)] mb-6"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.6-4.3 7.3-10.6 7.3-17.5z" fill="#4285F4"/>
              <path d="M24 48c6.6 0 12.2-2.2 16.2-6l-7.9-6c-2.2 1.5-5 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1H2.1v6.2C6.1 42.8 14.4 48 24 48z" fill="#34A853"/>
              <path d="M10.3 28.2c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7v-6.2H2.1C.8 15.6 0 19.7 0 24s.8 8.4 2.1 11.4l8.2-7.2z" fill="#FBBC05"/>
              <path d="M24 9.5c3.6 0 6.8 1.2 9.3 3.6l7-7C36.2 2.2 30.6 0 24 0 14.4 0 6.1 5.2 2.1 12.8l8.2 6.2C12.2 13.8 17.6 9.5 24 9.5z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] opacity-40">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

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
