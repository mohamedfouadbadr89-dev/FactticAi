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

    // Log individual failures but continue — degrade gracefully
    if (snapshotError) logger.warn('DASHBOARD_SNAPSHOT_UNAVAILABLE', { orgId, error: snapshotError.message });
    if (predictionError) logger.warn('DASHBOARD_PREDICTIONS_UNAVAILABLE', { orgId, error: predictionError.message });
    if (alertsError) logger.warn('DASHBOARD_ALERTS_UNAVAILABLE', { orgId, error: alertsError.message });
    if (eventsError) logger.warn('DASHBOARD_EVENTS_UNAVAILABLE', { orgId, error: eventsError.message });
    if (incidentsError) logger.warn('DASHBOARD_INCIDENTS_UNAVAILABLE', { orgId, error: incidentsError?.message });

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

    // RCA Confidence: derived from event volume — more real data = higher confidence
    // Starts at 0%, grows with volume, caps at 95% (never claim 100% certainty)
    const rcaConfidencePct = totalEvents24h === 0
      ? 0
      : Math.min(95, 40 + Math.min(totalEvents24h, 55));
    const rcaConfidence = `${rcaConfidencePct}%`;

    // Tamper Integrity: only say "Verified" if we have a real snapshot with determinism_flag
    const tamperIntegrity = !latestSnapshot
      ? "No Snapshot"
      : latestSnapshot.determinism_flag === false
        ? "Warning"
        : "Verified";

    // Policy adherence: N/A when no traffic, otherwise real ratio
    const policyAdherence = totalEvents24h === 0
      ? "N/A"
      : `${((1 - (blockedEvents24h / totalEvents24h)) * 100).toFixed(1)}% compliant`;

    // 3. Construct the DashboardData object
    const dashboardData = {
      health: {
        governance_score: computedHealth,
        sessions_today: totalEvents24h,
        voice_calls: voiceCalls24h,
        drift_freq: `${driftForHealth.toFixed(1)}%`,
        rca_confidence: rcaConfidence,
        policy_adherence: policyAdherence,
        behavioral_drift: driftForHealth > 5 ? "Critical" : driftForHealth > 2 ? "Monitor" : "Stable",
        open_alerts: activeIncidents,
        tamper_integrity: tamperIntegrity,
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
        avg_risk_30d: avgRisk24h / 100,
        percentage_change: driftForHealth > 0 ? +(driftForHealth - 2).toFixed(1) : 0,
        trend: predictions?.map(p => +(Number(p.drift_score) * 100).toFixed(1)).reverse() || []
      },
      intelligence: {
        pii_exposed_today: recentEvents?.filter(e => JSON.stringify(e).includes('PII')).length || 0,
        compliance_drift_score: driftForHealth / 100,
        recent_violations: alerts?.filter(a => a.alert_type === 'POLICY_VIOLATION_BLOCK').map(a => ({
          id: a.id.substring(0, 5),
          type: a.metadata?.violation_type || 'POLICY_BLOCK',
          timestamp: new Date(a.created_at).toLocaleTimeString()
        })) || [],
        pii_trend: recentEvents
          ? recentEvents.map((_, i) =>
              recentEvents.slice(0, i + 1).filter(e => JSON.stringify(e).includes('PII')).length
            ).slice(-15)
          : []
      },
      alerts: alerts?.map(a => ({
        id: a.id.substring(0, 8).toUpperCase(),
        title: a.alert_type?.replace(/_/g, ' ') || 'Governance Alert',
        description: a.metadata?.reason || `Severity level: ${a.severity}`,
        meta: `${a.id.substring(0, 7)} · ${new Date(a.created_at).toLocaleTimeString()}`,
        severity: (a.severity === 'critical' || a.severity === 'warning') ? 'High' : 'Low'
      })) || [],
      risks: [
        { label: "Policy Adherence", value: policyAdherence, percent: totalEvents24h > 0 ? ((1 - (blockedEvents24h/totalEvents24h)) * 100) : 0, color: "text-emerald-700", barColor: "bg-emerald-500" },
        { label: "Behavioral Drift", value: `${driftForHealth.toFixed(1)}%`, percent: Math.min(driftForHealth * 10, 100), color: driftForHealth > 5 ? "text-red-700" : "text-amber-700", barColor: driftForHealth > 5 ? "bg-red-500" : "bg-amber-500" },
        { label: "Tamper Integrity", value: tamperIntegrity, percent: tamperIntegrity === "Verified" ? 100 : tamperIntegrity === "Warning" ? 30 : 0, color: tamperIntegrity === "Verified" ? "text-emerald-700" : tamperIntegrity === "Warning" ? "text-red-700" : "text-gray-500", barColor: tamperIntegrity === "Verified" ? "bg-emerald-500" : tamperIntegrity === "Warning" ? "bg-red-500" : "bg-gray-400" },
        { label: "RCA Confidence", value: rcaConfidence, percent: rcaConfidencePct, color: "text-blue-700", barColor: "bg-blue-500" },
        { label: "Avg Risk (24h)", value: `${avgRisk24h.toFixed(1)}/100`, percent: avgRisk24h, color: avgRisk24h > 50 ? "text-amber-700" : "text-emerald-700", barColor: avgRisk24h > 50 ? "bg-amber-500" : "bg-emerald-500" },
        { label: "Open Incidents", value: String(activeIncidents), percent: Math.min(activeIncidents * 10, 100), color: activeIncidents > 5 ? "text-red-700" : "text-amber-700", barColor: activeIncidents > 5 ? "bg-red-500" : "bg-amber-500" },
      ],
      investigations: {
        open_count: activeIncidents,
        recent: alerts?.slice(0, 5).map(a => ({
          id: a.id.substring(0, 8).toUpperCase(),
          type: a.alert_type || 'GOVERNANCE_ALERT',
          severity: a.severity,
          created_at: a.created_at,
        })) || [],
      }
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
