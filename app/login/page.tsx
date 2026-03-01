'use client';

import { useState } from'react';
import { createBrowserClient } from'@supabase/auth-helpers-nextjs';
import { useRouter } from'next/navigation';
import { motion, AnimatePresence } from'framer-motion';

export default function LoginPage() {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const router = useRouter();
 
 // Create a supabase client on the browser with the modern API
 const supabase = createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 );

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 const { error: authError } = await supabase.auth.signInWithPassword({
 email,
 password,
 });

 if (authError) {
 setError(authError.message);
 setLoading(false);
 } else {
 router.push('/dashboard');
 router.refresh();
 }
 };

 return (
 <main className="bg-[var(--parch)] min-h-screen">
 <div className="login-wrapper">
 

 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="login-card"
 >
 <div className="logo-section">
 <div className="logo-text">FACTTIC_GOVERNANCE</div>
 <div >AUTH_FOUNDATION_v1.0</div>
 </div>

 <form onSubmit={handleLogin}>
 <div className="form-group">
 <label>Identity (Email)</label>
 <input 
 type="email" 
 value={email} 
 onChange={(e) => setEmail(e.target.value)} 
 placeholder="operator@facttic.ai"
 required 
 />
 </div>
 <div className="form-group">
 <label>Security Key (Password)</label>
 <input 
 type="password" 
 value={password} 
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••" 
 required 
 />
 </div>

 <button type="submit" disabled={loading}>
 {loading ?'AUTHENTICATING...' :'ACCESS DASHBOARD'}
 </button>
 </form>

 <AnimatePresence>
 {error && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height:'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="error-message"
 >
 {error}
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 </div>
 </main>
 );
}
