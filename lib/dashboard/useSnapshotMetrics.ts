"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export interface SnapshotMetrics {
  total_sessions: number;
  governance_events: number;
  incidents: number;
  organizations: number;
  failed_jobs: number;
  replayed_jobs: number;
}

interface UseSnapshotMetricsResult {
  metrics: SnapshotMetrics | null;
  loading: boolean;
  error: boolean;
}

const FALLBACK: SnapshotMetrics = {
  total_sessions: 0,
  governance_events: 0,
  incidents: 0,
  organizations: 0,
  failed_jobs: 0,
  replayed_jobs: 0,
};

/**
 * useSnapshotMetrics
 *
 * Fetches live aggregate counts from Supabase for the GovernanceSnapshotCard
 * "30-Day Summary" column. Replaces the previously hardcoded static values.
 *
 * Queries:
 *   SELECT COUNT(*) FROM sessions
 *   SELECT COUNT(*) FROM facttic_governance_events
 *   SELECT COUNT(*) FROM incidents
 *   SELECT COUNT(*) FROM organizations
 *   SELECT COUNT(*) FROM governance_failed_jobs WHERE replayed_at IS NULL
 *   SELECT COUNT(*) FROM governance_failed_jobs WHERE replayed_at IS NOT NULL
 *
 * Guarantees:
 *  - loading state while fetching
 *  - graceful fallback to zero-values if any query fails
 *  - all 4 queries run in parallel for minimal latency
 */
export function useSnapshotMetrics(): UseSnapshotMetricsResult {
  const [metrics, setMetrics] = useState<SnapshotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      setLoading(true);
      setError(false);

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      try {
        const [
          { count: sessions, error: sessionsErr },
          { count: govEvents, error: govEventsErr },
          { count: incidents, error: incidentsErr },
          { count: orgs, error: orgsErr },
          { count: failedJobs, error: failedJobsErr },
          { count: replayedJobs, error: replayedJobsErr }
        ] = await Promise.all([
          supabase
            .from("sessions")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("facttic_governance_events")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("incidents")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("organizations")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("governance_failed_jobs")
            .select("*", { count: "exact", head: true })
            .is("replayed_at", null),
          supabase
            .from("governance_failed_jobs")
            .select("*", { count: "exact", head: true })
            .not("replayed_at", "is", null)
        ]);

        // Log individual query failures but don't crash the whole card
        if (sessionsErr)      console.warn("[SnapshotMetrics] sessions query failed:", sessionsErr.message);
        if (govEventsErr)     console.warn("[SnapshotMetrics] facttic_governance_events query failed:", govEventsErr.message);
        if (incidentsErr)     console.warn("[SnapshotMetrics] incidents query failed:", incidentsErr.message);
        if (orgsErr)          console.warn("[SnapshotMetrics] organizations query failed:", orgsErr.message);
        if (failedJobsErr)    console.warn("[SnapshotMetrics] governance_failed_jobs null query failed:", failedJobsErr.message);
        if (replayedJobsErr)  console.warn("[SnapshotMetrics] governance_failed_jobs replayed query failed:", replayedJobsErr.message);

        if (!cancelled) {
          setMetrics({
            total_sessions:    sessions     ?? FALLBACK.total_sessions,
            governance_events: govEvents    ?? FALLBACK.governance_events,
            incidents:         incidents    ?? FALLBACK.incidents,
            organizations:     orgs         ?? FALLBACK.organizations,
            failed_jobs:       failedJobs   ?? FALLBACK.failed_jobs,
            replayed_jobs:     replayedJobs ?? FALLBACK.replayed_jobs,
          });
        }
      } catch (err) {
        console.error("[SnapshotMetrics] Unexpected fetch failure:", err);
        if (!cancelled) {
          setError(true);
          setMetrics(FALLBACK);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMetrics();
    return () => { cancelled = true; };
  }, []);

  return { metrics, loading, error };
}
