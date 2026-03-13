"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import ReplayViewer from "@/components/replay/ReplayViewer"
import { Clock, RefreshCw } from "lucide-react"

export default function ReplayPage() {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
      </div>
    }>
      <ReplayContent />
    </React.Suspense>
  )
}

function ReplayContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session")
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionId) return;
    
    async function fetchRecentSessions() {
      setLoading(true)
      try {
        const res = await fetch('/api/governance/sessions')
        if (res.ok) {
          const data = await res.json()
          console.log("Sessions loaded:", data.sessions)
          setRecentSessions(data.sessions || [])
        }
      } catch (error) {
        console.error("Failed to fetch recent sessions:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecentSessions()
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)]">
              Recent Sessions
            </h1>
          </div>
          
          {loading ? (
             <div className="p-10 flex justify-center">
                <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
             </div>
          ) : recentSessions.length > 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-4 px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                <div>Session ID</div>
                <div>Status</div>
                <div>Risk Score</div>
                <div>Time</div>
              </div>
              <div className="divide-y divide-[var(--border-primary)]">
                {recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/dashboard/replay?session=${session.id}`}
                    className="grid grid-cols-4 px-6 py-4 hover:bg-[var(--bg-primary)] transition-colors group cursor-pointer"
                  >
                    <div className="font-mono text-sm text-[var(--accent)] group-hover:underline truncate">
                      {session.id}
                    </div>
                    <div className={`text-sm font-bold uppercase ${session.status === 'blocked' ? 'text-red-400' : 'text-green-400'}`}>
                      {session.status ?? '—'}
                    </div>
                    <div className={`text-sm font-bold ${(session.total_risk ?? 0) > 50 ? 'text-red-400' : 'text-green-400'}`}>
                      {session.total_risk != null ? `${session.total_risk}%` : '—'}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {new Date(session.created_at).toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 border border-dashed border-[var(--border-primary)] rounded-xl text-center text-zinc-400">
              No recent sessions found.
            </div>
          )}
        </div>
      </div>
    )
  }

  return <ReplayViewer sessionId={sessionId} />
}