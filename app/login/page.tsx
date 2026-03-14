'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import FactticLogo from '@/components/ui/FactticLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
      <div className="w-full max-w-md section-card p-8 rounded-2xl shadow-xl">
        <div className="mb-8 text-center border-b border-[var(--border-primary)] pb-6">
          <div className="flex justify-center mb-5">
            <FactticLogo variant="horizontal" theme="auto" width={150} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-[var(--text-primary)]">Welcome Back</h1>
          <p className="text-sm text-[var(--text-secondary)]">Access the Governance Terminal</p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--surface-1)] transition-all text-sm font-semibold text-[var(--text-primary)] mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
            <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.6-4.3 7.3-10.6 7.3-17.5z" fill="#4285F4"/>
            <path d="M24 48c6.6 0 12.2-2.2 16.2-6l-7.9-6c-2.2 1.5-5 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1H2.1v6.2C6.1 42.8 14.4 48 24 48z" fill="#34A853"/>
            <path d="M10.3 28.2c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7v-6.2H2.1C.8 15.6 0 19.7 0 24s.8 8.4 2.1 11.4l8.2-7.2z" fill="#FBBC05"/>
            <path d="M24 9.5c3.6 0 6.8 1.2 9.3 3.6l7-7C36.2 2.2 30.6 0 24 0 14.4 0 6.1 5.2 2.1 12.8l8.2 6.2C12.2 13.8 17.6 9.5 24 9.5z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[var(--border-primary)]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] opacity-50">or</span>
          <div className="flex-1 h-px bg-[var(--border-primary)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-sm font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}
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
          <button type="submit" disabled={isLoading}
            className="w-full bg-[var(--accent)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-5 mt-5 border-t border-[var(--border-primary)] flex justify-between items-center">
          <a href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            Forgot Password?
          </a>
          <Link href="/signup" className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
