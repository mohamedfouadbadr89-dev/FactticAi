DO $$ 
DECLARE
    v_org_id UUID := 'c345de67-f89a-401b-c234-56789012cdef';
    i INTEGER;
BEGIN
    -- 1. Ensure Organization exists (Mock name if needed)
    INSERT INTO public.organizations (id, name)
    VALUES (v_org_id, 'BOOTSTRAP_VALIDATION_CORP')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Seed 25 Completed Sessions
    -- 8 LOW (0.05)
    FOR i IN 1..8 LOOP
        INSERT INTO public.sessions (org_id, status, total_risk, started_at, ended_at)
        VALUES (v_org_id, 'completed', 0.05, now() - (i || ' hours')::interval, now() - (i || ' hours')::interval + '30 minutes'::interval);
    END LOOP;

    -- 10 MEDIUM (0.35)
    FOR i IN 9..18 LOOP
        INSERT INTO public.sessions (org_id, status, total_risk, started_at, ended_at)
        VALUES (v_org_id, 'completed', 0.35, now() - (i || ' hours')::interval, now() - (i || ' hours')::interval + '30 minutes'::interval);
    END LOOP;

    -- 7 HIGH (0.65)
    FOR i IN 19..25 LOOP
        INSERT INTO public.sessions (org_id, status, total_risk, started_at, ended_at)
        VALUES (v_org_id, 'completed', 0.65, now() - (i || ' hours')::interval, now() - (i || ' hours')::interval + '30 minutes'::interval);
    END LOOP;

    -- 3. Seed 30 Governance Snapshots
    -- 10 with drift_detected = TRUE
    FOR i IN 1..10 LOOP
        INSERT INTO public.governance_snapshots (org_id, drift_detected, created_at)
        VALUES (v_org_id, TRUE, now() - (i || ' hours')::interval);
    END LOOP;

    -- 20 with drift_detected = FALSE
    FOR i IN 11..30 LOOP
        INSERT INTO public.governance_snapshots (org_id, drift_detected, created_at)
        VALUES (v_org_id, FALSE, now() - (i || ' hours')::interval);
    END LOOP;

    -- 4. Execute Validation Trigger
    PERFORM public.compute_executive_metrics(v_org_id);

END $$;
