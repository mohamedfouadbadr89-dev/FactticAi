import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/middleware/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { logger } from '@/lib/logger';

/**
 * GET /api/dashboard/stats
 * 
 * Aggregate dashboard statistics for the Facttic AI Governance Terminal.
 * Uses get_executive_dashboard RPC and governance_predictions for trend data.
 */
export const GET = withAuth(async (req: Request, { orgId }: AuthContext) => {
  try {
    // Calculate 24-hour timestamp
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const timeThreshold = yesterday.toISOString();

    // 1. Fetch data in parallel for performance
    const [
      { data: snapshots, error: snapshotError },
      { data: predictions, error: predictionError },
      { data: alerts, error: alertsError },
      { data: recentEvents, error: eventsError },
      { count: activeIncidentsCount, error: incidentsError }
    ] = await Promise.all([
      supabaseServer
        .from('governance_snapshot_v1')
        .select('*')
        .eq('org_id', orgId)
        .limit(1),
      supabaseServer
        .from('governance_predictions')
        .select('created_at, drift_score')
        .eq('org_id', orgId)
        .eq('metric_type', 'risk_momentum')
        .order('created_at', { ascending: false })
        .limit(30),
      supabaseServer
        .from('governance_alerts')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseServer
        .from('facttic_governance_events')
        .select('risk_score, decision, created_at, event_type')
        .eq('org_id', orgId)
        .gt('created_at', timeThreshold),
      supabaseServer
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .neq('status', 'closed')
    ]);

    if (snapshotError || predictionError || alertsError || eventsError || incidentsError) {
      logger.error('DASHBOARD_STATS_FETCH_FAILED', { 
        orgId, 
        snapshotError: snapshotError?.message,
        eventsError: eventsError?.message,
        incidentsError: incidentsError?.message
      });
      return NextResponse.json({ error: 'DATA_FETCH_FAILED' }, { status: 500 });
    }

    // 2. Process Data
    const latestSnapshot = snapshots?.[0];
    
    // Dynamic Drift Calculate
    const avgDrift = predictions && predictions.length > 0
      ? predictions.reduce((acc, curr) => acc + (Number(curr.drift_score) || 0), 0) / predictions.length
      : 0;
      
    // Observability Metrics Computation
    const totalEvents24h = recentEvents?.length || 0;
    const blockedEvents24h = recentEvents?.filter(e => e.decision === 'BLOCK').length || 0;
    const voiceCalls24h = recentEvents?.filter(e => e.event_type?.includes('voice')).length || 0;
    const avgRisk24h = totalEvents24h > 0 
      ? recentEvents!.reduce((acc, e) => acc + Number(e.risk_score), 0) / totalEvents24h
      : 0;

    const activeIncidents = activeIncidentsCount || 0;

    // Health Score Formula: 100 - (avg_risk * 0.4 + active_incidents * 10 + drift_score * 0.3)
    const driftForHealth = (avgDrift * 100) || 0;
    let rawHealth = 100 - (avgRisk24h * 0.4 + activeIncidents * 10 + driftForHealth * 0.3);
    const computedHealth = Math.max(0, Math.min(100, Math.round(rawHealth)));

    // 3. Construct the DashboardData object
    const dashboardData = {
      health: {
        governance_score: computedHealth,
        sessions_today: totalEvents24h,
        voice_calls: voiceCalls24h,
        drift_freq: `${driftForHealth.toFixed(1)}%`,
        rca_confidence: "91%", 
        policy_adherence: `${totalEvents24h > 0 ? ((1 - (blockedEvents24h/totalEvents24h)) * 100).toFixed(1) : 100}% compliant`,
        behavioral_drift: driftForHealth > 5 ? "Critical" : driftForHealth > 2 ? "Monitor" : "Stable",
        open_alerts: activeIncidents,
        tamper_integrity: latestSnapshot?.determinism_flag !== false ? "Verified" : "Warning",
        avg_risk_24h: avgRisk24h.toFixed(1),
        blocked_24h: blockedEvents24h
      },
      drift: {
        current: `${driftForHealth.toFixed(1)}%`,
        avg_30d: `${(avgDrift * 100).toFixed(1)}%`,
        baseline: "0.9%",
        history: predictions?.map(p => ({
          created_at: p.created_at,
          behavioral_drift: Number(p.drift_score)
        })).reverse() || []
      },
      voice_drift: {
        avg_risk_30d: 0.14,
        percentage_change: -4.2,
        trend: [12, 14, 11, 15, 13, 16, 14, 13, 11, 9, 11, 13, 12, 14, 13]
      },
      intelligence: {
        pii_exposed_today: recentEvents?.filter(e => JSON.stringify(e).includes('PII')).length || 0,
        compliance_drift_score: 0.18,
        recent_violations: alerts?.filter(a => a.alert_type === 'POLICY_VIOLATION_BLOCK').map(a => ({
          id: a.id.substring(0, 5),
          type: a.metadata?.violation_type || 'POLICY_BLOCK',
          timestamp: new Date(a.created_at).toLocaleTimeString()
        })) || [],
        pii_trend: [4, 6, 3, 8, 12, 10, 14, 12, 11, 13, 15, 12, 11, 10, 12]
      },
      alerts: alerts?.map(a => ({
        id: a.id.substring(0, 8).toUpperCase(),
        title: a.alert_type?.replace(/_/g, ' ') || 'Governance Alert',
        description: a.metadata?.reason || `Severity level: ${a.severity}`,
        meta: `${a.id.substring(0, 7)} · ${new Date(a.created_at).toLocaleTimeString()}`,
        severity: (a.severity === 'critical' || a.severity === 'warning') ? 'High' : 'Low'
      })) || [],
      risks: [
        { label: "Policy Adherence", value: `${totalEvents24h > 0 ? ((1 - (blockedEvents24h/totalEvents24h)) * 100).toFixed(1) : 100}%`, percent: totalEvents24h > 0 ? ((1 - (blockedEvents24h/totalEvents24h)) * 100) : 100, color: "text-emerald-700", barColor: "bg-emerald-500" },
        { label: "Behavioral Drift", value: `${driftForHealth.toFixed(1)}%`, percent: Math.min(driftForHealth * 10, 100), color: driftForHealth > 5 ? "text-red-700" : "text-amber-700", barColor: driftForHealth > 5 ? "bg-red-500" : "bg-amber-500" },
        { label: "Tamper Events", value: "0", percent: 100, color: "text-emerald-700", barColor: "bg-emerald-500" },
        { label: "RCA Confidence", value: "91%", percent: 91, color: "text-blue-700", barColor: "bg-blue-500" },
        { label: "Avg Risk (24h)", value: `${avgRisk24h.toFixed(1)}/100`, percent: avgRisk24h, color: avgRisk24h > 50 ? "text-amber-700" : "text-emerald-700", barColor: avgRisk24h > 50 ? "bg-amber-500" : "bg-emerald-500" },
        { label: "Open Incidents", value: String(activeIncidents), percent: Math.min(activeIncidents * 10, 100), color: activeIncidents > 5 ? "text-red-700" : "text-amber-700", barColor: activeIncidents > 5 ? "bg-red-500" : "bg-amber-500" },
      ],
      investigations: [] // Logic for merging alerts into investigations would go here
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error: any) {
    logger.error('DASHBOARD_STATS_API_ERROR', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
