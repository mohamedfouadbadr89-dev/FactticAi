'use client'

import React, { useState, useEffect } from'react'

interface Session {
 id: string
 org_id: string
 agent_id: string
 created_at: string
 metadata?: any
}

interface Turn {
 id: string
 turn_index: number
 role:'user' |'assistant'
 content: string
 risk_score?: number
}


export function ChatClient() {
 const [sessions, setSessions] = useState<Session[]>([])
 const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
 const [selectedSession, setSelectedSession] = useState<(Session & { turns: Turn[] }) | null>(null)
 const [loadingList, setLoadingList] = useState(true)
 const [loadingDetail, setLoadingDetail] = useState(false)

 useEffect(() => {
 async function fetchSessions() {
 try {
 const res = await fetch('/api/sessions')
 const json = await res.json()
 setSessions(json.data || [])
 } catch (err) {
 console.error('Failed to fetch sessions:', err)
 } finally {
 setLoadingList(false)
 }
 }
 fetchSessions()
 }, [])

 useEffect(() => {
 if (!selectedSessionId) return
 async function fetchDetail() {
 setLoadingDetail(true)
 try {
 const res = await fetch(`/api/sessions/${selectedSessionId}`)
 const json = await res.json()
 setSelectedSession(json.data)
 } catch (err) {
 console.error('Failed to fetch session detail:', err)
 } finally {
 setLoadingDetail(false)
 }
 }
 fetchDetail()
 }, [selectedSessionId])

 return (
 <div className="w-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col gap-6 h-[calc(100vh-160px)]">
 <div className="pb-6 border-b">
 <h1 className="text-3xl font-bold tracking-tight mb-1">Session Explorer</h1>
 <p className="text-sm font-medium">Full deterministic audit trail and interaction replay.</p>
 </div>

 <div className="flex flex-1 gap-6 min-h-0">
 {/* Session List - Standardized to Section Card */}
 <div className="w-80 section-card flex flex-col overflow-hidden">
 <div className="p-4 border-b /50 transition-colors duration-300">
 <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] px-1 border-l-2 border-[var(--accent)] transition-colors duration-300">Archived Sessions</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-2 space-y-1">
 {loadingList ? (
 Array(5).fill(0).map((_, i) => (
 <div key={i} className="h-16 animate-pulse rounded-lg" />
 ))
 ) : sessions.length > 0 ? (
 sessions.map((s) => (
 <button
 key={s.id}
 onClick={() => setSelectedSessionId(s.id)}
 className={`w-full text-left p-4 rounded-lg transition-all group ${
 selectedSessionId === s.id ?'bg-[var(--accent)] text-[var(--bg-primary)] shadow-md' :'bg-transparent hover: hover:'
 }`}
 >
 <div className="flex justify-between items-start mb-1">
 <span className={`text-xs font-bold font-mono ${selectedSessionId === s.id ?'text-[var(--bg-primary)]' :''}`}>
 {s.id.substring(0, 12)}
 </span>
 <span className={`text-[9px] font-bold ${selectedSessionId === s.id ?'text-[var(--bg-secondary)]' :''}`}>
 {new Date(s.created_at).toLocaleDateString()}
 </span>
 </div>
 <div className={`text-[9px] uppercase font-black tracking-tight ${selectedSessionId === s.id ?'text-[var(--warning)]' :''}`}>
 ID SOURCE: <span className={selectedSessionId === s.id ?'text-[var(--bg-primary)]' :''}>{s.agent_id}</span>
 </div>
 </button>
 ))
 ) : (
 <div className="text-center py-20 text-[10px] font-black uppercase italic tracking-widest">
 Zero sessions recorded
 </div>
 )}
 </div>
 </div>

 {/* Replay View - Standardized Canvas */}
 <div className="flex-1 section-card flex flex-col overflow-hidden relative">
 {!selectedSessionId ? (
 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center /20">
 <div className="w-16 h-16 rounded-full bg-[var(--accent)]/5 flex items-center justify-center mb-6 border border-[var(--border-primary)] transition-colors duration-300">
 <svg className="w-6 h-6 text-[var(--accent)] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
 </div>
 <h3 className="font-black uppercase tracking-[0.1em] text-sm mb-2">Institutional Replay Engine</h3>
 <p className="text-[10px] font-bold uppercase tracking-widest max-w-xs leading-relaxed">
 Select a session for deterministic audit trail verification.
 </p>
 </div>
 ) : (
 <>
 <div className="px-8 py-6 border-b flex justify-between items-center bg-[var(--card-bg)] z-10">
 <div className="flex items-center gap-4">
 <div className="flex flex-col">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] px-1 border-l-2 border-[var(--accent)] transition-colors duration-300">Interactive Audit</span>
 <span className="text-[11px] font-bold font-mono mt-1">
 {selectedSessionId}
 </span>
 </div>
 </div>
 
 {selectedSession && (
 <div className="flex items-center gap-4">
 <div className="text-right">
 <div className="text-[9px] font-black uppercase tracking-widest">Aggregate Risk</div>
 <div className="text-2xl font-black text-[var(--accent)] leading-none tracking-tighter transition-colors duration-300">
 {((selectedSession.turns?.reduce((acc: number, t: Turn) => acc + (t.risk_score || 0), 0) / (selectedSession.turns?.length || 1) || 0) * 100).toFixed(1)}
 </div>
 </div>
 <div className="w-10 h-10 rounded-lg border flex items-center justify-center">
 <div className="status-indicator success animate-pulse" />
 </div>
 </div>
 )}
 </div>

 <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-[var(--card-bg)]">
 {loadingDetail ? (
 <div className="flex justify-center py-20">
 <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.3s] transition-colors duration-300" />
 <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:-0.15s] mx-2 transition-colors duration-300" />
 <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce transition-colors duration-300" />
 </div>
 ) : selectedSession?.turns && selectedSession.turns.length > 0 ? (
 selectedSession.turns.map((turn) => (
 <div 
 key={turn.id} 
 className={`flex flex-col ${turn.role ==='assistant' ?'items-start' :'items-end'} max-w-[85%] ${
 turn.role ==='assistant' ?'mr-auto' :'ml-auto'
 }`}
 >
 <div className="flex items-center gap-2 mb-2">
 <span className={`text-[9px] font-black uppercase tracking-widest ${turn.role ==='assistant' ?'text-[var(--accent)]' :''}`}>
 {turn.role}
 </span>
 {turn.risk_score !== undefined && (
 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
 turn.risk_score > 0.4 ?'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20' :'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
 }`}>
 Score: {(turn.risk_score * 100).toFixed(1)}
 </span>
 )}
 </div>
 <div className={`p-6 rounded-2xl text-[13px] leading-relaxed transition-colors duration-300 ${
 turn.role ==='assistant' 
 ?'bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-bl-none' 
 :'bg-[var(--accent)] text-[var(--bg-primary)] font-medium rounded-br-none shadow-lg shadow-[var(--accent)]/10'
 }`}>
 {turn.content}
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-32">
 <div className="font-black uppercase tracking-[0.3em] italic text-xs">Zero artifacts found</div>
 </div>
 )}
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )
}
