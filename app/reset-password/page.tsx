'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ShieldAlert, ArrowRight, LockKeyhole } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Note: Supabase automatically handles the hash in the URL and establishes
  // a temporary session allowing updateUser to work without prior login.
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (password.length < 8) throw new Error('Password must be at least 8 characters prioritizing robust entropy.');

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) throw updateError;
      
      setSuccess(true);
      logger.info('PASSWORD_RESET_EXECUTED');
      
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
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
            <LockKeyhole className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--text-primary)] mb-2 uppercase">Establish Sec-Key</h1>
          <p className="text-xs font-medium text-[var(--text-secondary)] tracking-widest uppercase opacity-60">Generate replacement entropy</p>
        </div>

        <div className="section-card p-10 rounded-3xl shadow-2xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
          {success ? (
            <div className="text-center animate-[fadeIn_.4s_ease-in-out]">
              <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-xl inline-block mb-4">
                <ShieldAlert className="w-8 h-8 text-[var(--success)]" />
              </div>
              <p className="text-sm font-bold text-[var(--success)] uppercase tracking-widest">
                Cryptographic Key Re-established
              </p>
              <p className="text-xs mt-2 text-gray-400">Rerouting authorization tunnel...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 animate-[fadeIn_.4s_ease-in-out]">
              {error && (
                <div className="p-4 text-xs font-black text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error.toUpperCase()}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] block">New Passkey</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-11 p-4 bg-[var(--bg-primary)] border border-white/5 rounded-xl text-sm focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isLoading || password.length < 8}
                  className="w-full group relative overflow-hidden bg-[var(--accent)] text-white font-black uppercase tracking-[0.3em] text-[11px] px-8 py-5 rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? 'Encrypting...' : 'Commit New Passkey'}
                    {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
