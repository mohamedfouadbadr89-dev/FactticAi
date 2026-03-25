import React from 'react';
import { supabaseServer } from '@/lib/supabaseServer';
import LiveReportClient from './LiveReportClient';

export const dynamic = 'force-dynamic';

export default async function LiveReportPage() {
  const { data: intercepts, error } = await supabaseServer
    .from('runtime_intercepts')
    .select('risk_score, action, session_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }

  const sessionIds = intercepts?.map(i => i.session_id) || [];

  const { data: voiceSessions } = sessionIds.length > 0
    ? await supabaseServer
        .from('voice_sessions')
        .select('session_id, provider, call_started_at')
        .in('session_id', sessionIds)
    : { data: [] };

  const voiceSessionIds = new Set(voiceSessions?.map(v => v.session_id) || []);

  const parsedData = intercepts?.map((i: any) => {
    const p = i.payload || {};
    const score = parseFloat(i.risk_score);
    const channel = voiceSessionIds.has(i.session_id) || p.channel === 'voice' ? 'voice' : 'text';
    return {
      risk_score: score,
      action: i.action,
      phase_id: p.phase_id || i.session_id.substring(0, 6).toUpperCase(),
      prompt_preview: p.prompt_preview,
      intent_drift: p.behavior?.intent_drift || 0,
      channel,
      created_at: i.created_at,
    };
  }) || [];

  const blockedCount   = parsedData.filter(c => c.action === 'block').length;
  const violationCount = parsedData.filter(c => c.risk_score >= 92).length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8 lg:p-12">
      <div className="max-w-[1200px] mx-auto">
        <LiveReportClient
          parsedData={parsedData}
          voiceSessionsCorrelated={voiceSessions?.length || 0}
          blockedCount={blockedCount}
          violationCount={violationCount}
        />
      </div>
    </div>
  );
}
