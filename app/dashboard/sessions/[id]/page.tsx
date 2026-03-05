'use client';

import React, { useEffect, useState } from'react';
import { useParams, useRouter } from'next/navigation';
import { motion, AnimatePresence } from'framer-motion';

import { TurnTimeline } from'@/components/session/TurnTimeline';
import { RcaDrawer } from'@/components/session/RcaDrawer';
import { SessionRadar } from'@/components/session/SessionRadar';
import { RiskDistributionChart } from'@/components/session/RiskDistributionChart';
import { DriftIndicator } from'@/components/session/DriftIndicator';
import { ViewModeToggle } from'@/components/session/ViewModeToggle';

export default function SessionDetailsPage() {
 const params = useParams();
 const id = params?.id as string;

 const router = useRouter();

 const [session, setSession] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [selectedTurn, setSelectedTurn] = useState<any | null>(null);
 const [viewMode, setViewMode] = useState<'executive' |'technical'>('executive');

 useEffect(() => {
 async function fetchSession() {
 if (!id) {
 setError('Missing session identifier');
 setLoading(false);
 return;
 }

 try {
 const res = await fetch(`/api/sessions/${id}`);

 if (!res.ok) {
 if (res.status === 401) {
 router.push('/login');
 return;
 }

 throw new Error('Failed to fetch session details');
 }

 const json = await res.json();
 setSession(json.data);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 }

 if (id) fetchSession();
 }, [id, router]);

 const aggregateFactors =
 session?.turns?.reduce((acc: any, turn: any) => {
 turn.factors?.forEach((f: any) => {
 acc[f.type] = (acc[f.type] || 0) + f.weight;
 });
 return acc;
 }, {} as any) || {};

 if (loading) {
 return (
 <div className="min-h-screen bg-[var(--card-bg)] flex items-center justify-center p-8">
 <div className="text-[var(--text-secondary)] font-mono animate-pulse uppercase tracking-widest text-sm text-center">
 <div className="mb-4 text-[var(--parch)] font-bold opacity-30">
 INTEL_LAYER_ACTIVE
 </div>
 Initializing Forensic Inspector...
 </div>
 </div>
 );
 }

 if (error || !session) {
 return (
 <div className="min-h-screen bg-[var(--card-bg)] flex items-center justify-center p-8">
 <div className="max-w-md w-full border border-red-500/30 bg-red-500/5 p-6 rounded text-center">
 <h2 className="text-red-400 font-bold uppercase tracking-tighter mb-2">
 Access Denied / Error
 </h2>
 <p className="text-sm text-red-300/70 mb-6">
 {error ||'Session not found.'}
 </p>
 <button
 onClick={() => router.push('/dashboard')}
 className="text-xs font-bold text-[var(--parch)] uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-[var(--card-bg)]/10 transition-colors"
 >
 Return to Dashboard
 </button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[#F8FAFC] text-[var(--text-primary)] selection:bg-[var(--gold-soft)]">
 <header className="border-b border-[var(--border-primary)] bg-[var(--card-bg)] sticky top-0 z-30 backdrop-blur-md">
 <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <button
 onClick={() => router.push('/dashboard')}
 className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
 >
 ←
 </button>

 <div>
 <h1 className="text-lg font-bold uppercase tracking-tighter leading-none">
 Session Inspector
 </h1>
 <span className="text-[10px] font-mono text-[var(--text-secondary)] tracking-widest">
 {id}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-6">
 <ViewModeToggle mode={viewMode} onChange={setViewMode} />

 <div className="h-8 w-[1px]" />

 <div className="text-right">
 <span className="block text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1">
 Total Risk
 </span>
 <span
 className={`text-xl font-mono font-bold leading-none ${
 session.total_risk > 0.5
 ?'text-red-400'
 :'text-emerald-400'
 }`}
 >
 {(session.total_risk * 100).toFixed(1)}%
 </span>
 </div>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto py-12 px-6">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
 <div className="lg:col-span-5 space-y-10">
 <SessionRadar factors={aggregateFactors} />
 <RiskDistributionChart turns={session.turns || []} />
 <DriftIndicator drift={session.drift || 0} />
 </div>

 <div className="lg:col-span-7">
 {viewMode ==='technical' ? (
 <TurnTimeline
 turns={session.turns || []}
 onInspect={(turn) => setSelectedTurn(turn)}
 />
 ) : (
 <div className="bg-[var(--card-bg)] border border-[var(--border-primary)] p-8 rounded-lg">
 <h3 className="text-xl font-bold mb-4">
 Executive Narrative
 </h3>

 <p className="text-[var(--text-secondary)] text-sm">
 This session generated a cumulative risk of{''}
 {(session.total_risk * 100).toFixed(1)}%.
 </p>
 </div>
 )}
 </div>
 </div>
 </main>

  <RcaDrawer 
    sessionId={id}
    turn={selectedTurn} 
    onClose={() => setSelectedTurn(null)} 
  />
 </div>
 );
}