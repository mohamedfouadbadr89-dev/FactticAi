'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  User,
  Shield,
  Building,
  Mail,
  MapPin,
  Briefcase,
  Clock,
  Fingerprint,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { logger } from '@/lib/logger';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchIdentity() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUser(user);

        // Fetch Membership & Org
        const { data: member } = await supabase
          .from('org_members')
          .select('role, org_id, organizations(name, slug)')
          .eq('user_id', user.id)
          .single();

        if (member) {
          setOrg(member.organizations);
          setProfile((prev: any) => ({ ...prev, role: member.role }));
        }

        // Fetch Profile Metadata
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          setProfile((prev: any) => ({ ...prev, ...profileData }));
        }
      } catch (err: any) {
        logger.error('PROFILE_LOAD_FAILED', { error: err.message });
      } finally {
        setLoading(false);
      }
    }

    fetchIdentity();
  }, [supabase]);

  const handleUpdate = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      // Update display name in the users table (profiles table does not exist in schema)
      if (profile?.full_name || profile?.job_title) {
        const { error } = await supabase
          .from('users')
          .update({ name: profile.full_name || profile.job_title })
          .eq('id', user.id);
        if (error) throw error;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError('Failed to save profile. Please try again.');
      logger.error('PROFILE_UPDATE_FAILED', { error: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)] opacity-20" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="flex justify-between items-end pb-8 border-b border-[var(--border-primary)]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl border border-[var(--accent)]/20">
                <Shield className="w-6 h-6" />
             </div>
             <h1 className="text-3xl font-black tracking-tighter uppercase">Identity Profile</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Manage your governance standing and institutional metadata.</p>
        </div>
        <div className="flex items-center gap-4 bg-[var(--bg-secondary)] p-1.5 rounded-2xl border border-[var(--border-primary)] shadow-inner">
           <span className="px-5 py-2 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[var(--accent)]/20">
              {profile?.role || 'VIEWER'}
           </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Core Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-8 space-y-8 border-[var(--border-primary)] bg-gradient-to-br from-white/[0.03] to-transparent">
             <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-soft)] p-1 shadow-2xl">
                   <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center border-4 border-[var(--bg-primary)]">
                      <User className="w-10 h-10 text-[var(--accent)]" />
                   </div>
                </div>
                <div>
                   <h2 className="text-xl font-bold tracking-tight">{user?.user_metadata?.full_name || 'Anonymous User'}</h2>
                   <p className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-1">Institutional ID: {user?.id?.slice(0, 12)}</p>
                </div>
             </div>

             <div className="space-y-5 pt-4 border-t border-[var(--border-primary)]">
                <div className="flex items-center gap-4 group">
                   <Mail className="w-4 h-4 text-gray-500 group-hover:text-[var(--accent)] transition-colors" />
                   <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Email Binding</span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">{user?.email}</span>
                   </div>
                </div>
                <div className="flex items-center gap-4 group">
                   <Building className="w-4 h-4 text-gray-500 group-hover:text-[var(--accent)] transition-colors" />
                   <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Affiliation</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{org?.name || 'Deattached Identity'}</span>
                   </div>
                </div>
                <div className="flex items-center gap-4 group">
                   <Clock className="w-4 h-4 text-gray-500 group-hover:text-[var(--accent)] transition-colors" />
                   <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Inducted At</span>
                      <span className="text-sm font-mono text-[var(--text-primary)]">{new Date(user?.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4 shadow-inner">
             <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Fingerprint className="w-5 h-5" />
             </div>
             <div>
                <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest block">Status</span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active & Verified</span>
             </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="lg:col-span-8">
           <div className="card p-10 space-y-10 shadow-2xl border-[var(--border-primary)]">
              <section className="space-y-8">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-primary)]">
                   <Briefcase className="w-5 h-5 text-[var(--accent)]" />
                   <h3 className="font-black text-xs tracking-[0.3em] uppercase">Occupational Metadata</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block ml-1">Current Job Title</label>
                      <input 
                        type="text" 
                        value={profile?.job_title || ''} 
                        onChange={(e) => setProfile({...profile, job_title: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 rounded-xl text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none shadow-inner" 
                        placeholder="Risk Analyst"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block ml-1">Assigned Department</label>
                      <input 
                        type="text" 
                        value={profile?.department || ''} 
                        onChange={(e) => setProfile({...profile, department: e.target.value})}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 rounded-xl text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none shadow-inner" 
                        placeholder="AI Safety Operations"
                      />
                   </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-primary)]">
                   <User className="w-5 h-5 text-[var(--accent)]" />
                   <h3 className="font-black text-xs tracking-[0.3em] uppercase">Professional Narrative</h3>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block ml-1">Identity Bio</label>
                   <textarea 
                     rows={4}
                     value={profile?.bio || ''} 
                     onChange={(e) => setProfile({...profile, bio: e.target.value})}
                     className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] p-5 rounded-2xl text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-4 ring-[var(--accent)]/5 transition-all outline-none shadow-inner resize-none" 
                     placeholder="Institutional focus on deterministic risk modeling and multi-agent safety..."
                   />
                </div>
              </section>

              <footer className="pt-6 flex flex-col gap-3">
                 {saveSuccess && (
                   <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                     <CheckCircle2 className="w-4 h-4" /> Profile synchronized successfully.
                   </div>
                 )}
                 {saveError && (
                   <div className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                     {saveError}
                   </div>
                 )}
                 <div className="flex justify-end gap-4">
                   <button
                     onClick={() => {
                       localStorage.removeItem('facttic_tour_completed');
                       window.location.reload();
                     }}
                     type="button"
                     className="group relative inline-flex items-center gap-3 bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-primary)] font-black uppercase tracking-[0.3em] text-[10px] px-8 py-4 rounded-xl transition-all shadow-inner hover:border-[var(--accent)] active:scale-[0.98]"
                   >
                     Reset Tour
                   </button>
                   <button
                     onClick={handleUpdate}
                     disabled={saving}
                     className="group relative inline-flex items-center gap-3 bg-[var(--accent)] text-white font-black uppercase tracking-[0.3em] text-[10px] px-8 py-4 rounded-xl hover:opacity-90 transition-all shadow-[0_20px_40px_-15px_rgba(var(--accent-rgb),0.4)] active:scale-[0.98] disabled:opacity-50"
                   >
                     {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                     ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Synchronized
                        </>
                     ) : (
                        <>
                          <Save className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                          Synchronize Profile
                        </>
                     )}
                   </button>
                 </div>
              </footer>
           </div>
        </div>
      </div>
    </div>
  );
}
