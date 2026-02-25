-- PHASE 3A-V BOOTSTRAP EXIT VALIDATION SCRIPT
-- Target Org: c345de67-f89a-401b-c234-56789012cdef

-- 1. Verify Session Ingestion
SELECT count(*) as session_count 
FROM public.sessions 
WHERE org_id = 'c345de67-f89a-401b-c234-56789012cdef';

-- 2. Verify Snapshot Accumulation
SELECT count(*) as snapshot_count 
FROM public.governance_snapshots 
WHERE org_id = 'c345de67-f89a-401b-c234-56789012cdef';

-- 3. Verify Operational Transition
-- Expectation: 'operational'
SELECT system_mode, risk_index as ghs, drift_score as dfi, completed_sessions_count 
FROM public.governance_predictions 
WHERE org_id = 'c345de67-f89a-401b-c234-56789012cdef' 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. Verify Intelligence Output (Re-trigger and inspect JSON)
SELECT public.compute_executive_metrics('c345de67-f89a-401b-c234-56789012cdef'::uuid);
