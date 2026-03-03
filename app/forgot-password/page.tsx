'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, ArrowRight, KeyRound, Mail } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setSuccess(true);
      logger.info('PASSWORD_RESET_REQUESTED', { email });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4 border border-[var(--accent)]/20">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] mb-2 uppercase">Credential Recovery</h1>
          <p className="text-xs font-medium text-[var(--text-secondary)] tracking-widest uppercase opacity-60">Initiate Cryptographic Reset</p>
        </div>

        <div className="section-card p-10 rounded-3xl shadow-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
          {success ? (
            <div className="space-y-6 text-center animate-[fadeIn_.4s_ease-in-out]">
              <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-xl inline-block">
                <Mail className="w-8 h-8 text-[var(--success)]" />
              </div>
              <p className="text-sm font-bold text-gray-300">
                Recovery protocol initiated. If the identity exists, verification coordinates have been dispatched to your email.
              </p>
              <button 
                onClick={() => router.push('/login')}
                className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)] hover:underline"
              >
                Return to Authorization
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
              {error && (
                <div className="p-4 text-xs font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                  {error.toUpperCase()}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] block">Registered Identity Link</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@institution.com"
                    className="w-full pl-11 p-4 bg-[var(--bg-primary)] border border-white/5 rounded-xl text-sm focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isLoading || !email}
                  className="w-full group relative overflow-hidden bg-[var(--accent)] text-white font-black uppercase tracking-[0.3em] text-[11px] px-8 py-5 rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? 'Transmitting...' : 'Dispatch Reset Link'}
                    {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
              </div>
            </form>
          )}

          {!success && (
            <div className="mt-8 text-center border-t border-white/5 pt-6">
              <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                Cancel Reset Protocol
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
