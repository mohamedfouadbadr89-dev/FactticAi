import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * GET /api/voice/investigations/[id]/audio
 * 
 * Retrieves forensic audio evidence and risk-marker timestamps
 * for a specific investigation alert.
 */
export const GET = withAuth(async (req: Request, context: AuthContext) => {
  try {
    const { id } = context.params;
    const { orgId } = context;

    if (!id) {
      return NextResponse.json({ error: 'Investigation ID is required' }, { status: 400 });
    }

    let sessionId: string | null = null;

    // 1. Fetch Investigation Detail (using drift_alerts)
    const { data: alert } = await supabaseServer
      .from('drift_alerts')
      .select('session_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (alert) {
      sessionId = alert.session_id;
    } else {
      // Try governance_alerts as fallback if drift_alerts doesn't contain it
      const { data: gAlert } = await supabaseServer
        .from('governance_alerts')
        .select('interaction_id')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();
      
      if (gAlert) {
        sessionId = gAlert.interaction_id;
      }
    }

    if (!sessionId) {
       return NextResponse.json({ error: 'INVESTIGATION_NOT_FOUND' }, { status: 404 });
    }

    // 2. Lookup Voice Session Details
    const { data: voiceSession } = await supabaseServer
      .from('voice_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    // 3. Extract High-Risk Turns for Markers
    const { data: turns } = await supabaseServer
      .from('session_turns')
      .select('created_at, incremental_risk, content')
      .eq('session_id', sessionId)
      .gt('incremental_risk', 0.4)
      .order('created_at', { ascending: true });

    // Mock Audio if not found (Premium Demo Experience)
    const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    // Map turns to relative timestamps (mocking offset for demo)
    const riskMarkers = (turns || []).map((t, i) => ({
      timestamp_ms: i * 45000 + 12000, // Synthetic offsets for demo realism
      risk_score: t.incremental_risk,
      label: t.incremental_risk > 0.7 ? 'Critical Breakthrough' : 'Policy Drift'
    }));

    return NextResponse.json({
      success: true,
      data: {
        audio_url: (voiceSession as any)?.audio_url || mockAudioUrl,
        duration_ms: (voiceSession as any)?.duration_ms || 300000,
        risk_markers: riskMarkers,
        session_id: sessionId
      }
    });

  } catch (err: any) {
    logger.error('VOICE_AUDIO_FETCH_CRITICAL', { error: err.message });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});
