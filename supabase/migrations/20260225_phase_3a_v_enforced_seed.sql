DO $$ 
DECLARE
    v_org_id UUID := 'c345de67-f89a-401b-c234-56789012cdef';
    v_region_id UUID := gen_random_uuid();
    i INTEGER;
BEGIN
    INSERT INTO public.organizations (id, name, region_id, created_at)
    VALUES (v_org_id, 'BOOTSTRAP_VALIDATION_CORP', v_region_id, now())
    ON CONFLICT (id) DO NOTHING;

    FOR i IN 1..8 LOOP
        INSERT INTO public.sessions (id, org_id, status, total_risk, started_at, ended_at)
        VALUES (
            gen_random_uuid(),
            v_org_id,
            'completed',
            0.05,
            now() - (i || ' hours')::interval,
            now() - (i || ' hours')::interval + '30 minutes'::interval
        );
    END LOOP;

    FOR i IN 9..18 LOOP
        INSERT INTO public.sessions (id, org_id, status, total_risk, started_at, ended_at)
        VALUES (
            gen_random_uuid(),
            v_org_id,
            'completed',
            0.35,
            now() - (i || ' hours')::interval,
            now() - (i || ' hours')::interval + '30 minutes'::interval
        );
    END LOOP;

    FOR i IN 19..25 LOOP
        INSERT INTO public.sessions (id, org_id, status, total_risk, started_at, ended_at)
        VALUES (
            gen_random_uuid(),
            v_org_id,
            'completed',
            0.65,
            now() - (i || ' hours')::interval,
            now() - (i || ' hours')::interval + '30 minutes'::interval
        );
    END LOOP;

    FOR i IN 1..10 LOOP
        INSERT INTO public.governance_snapshots (id, org_id, drift_detected, created_at)
        VALUES (
            gen_random_uuid(),
            v_org_id,
            TRUE,
            now() - (i || ' hours')::interval
        );
    END LOOP;

    FOR i IN 11..30 LOOP
        INSERT INTO public.governance_snapshots (id, org_id, drift_detected, created_at)
        VALUES (
            gen_random_uuid(),
            v_org_id,
            FALSE,
            now() - (i || ' hours')::interval
        );
    END LOOP;

    PERFORM public.compute_executive_metrics(v_org_id);

END $$;