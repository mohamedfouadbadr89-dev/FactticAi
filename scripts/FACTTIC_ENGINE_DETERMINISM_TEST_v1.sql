-- FACTTIC ENGINE DETERMINISM TEST v1.0
-- Objective: Validate reproducibility of governance outputs across multiple execution cycles.
-- Usage: Set variables and execute in SQL console.

DO $$
DECLARE
    -- INPUT VARIABLES (Adjust as needed for target validation)
    v_org_id UUID := 'jtqovfjlnryuduzktflk';
    v_agent_id UUID := '00000000-0000-0000-0000-000000000001';
    v_agent_version TEXT := 'v1.0';

    -- CYCLE 1 OUTPUTS
    v1_momentum NUMERIC;
    v1_acceleration NUMERIC;
    v1_momentum_state TEXT;
    v1_severity TEXT;
    v1_health_index INTEGER;
    v1_determinism BOOLEAN;

    -- CYCLE 2 OUTPUTS
    v2_momentum NUMERIC;
    v2_acceleration NUMERIC;
    v2_momentum_state TEXT;
    v2_severity TEXT;
    v2_health_index INTEGER;
    v2_determinism BOOLEAN;

    v_final_result TEXT := 'FAIL';
BEGIN
    RAISE NOTICE 'FACTTIC: STARTING DETERMINISM VALIDATION CYCLE v1.0';

    -- [RUN 1]
    v1_momentum := public.compute_agent_version_momentum(v_org_id, v_agent_id, v_agent_version);
    v1_acceleration := public.compute_agent_version_acceleration(v_org_id, v_agent_id, v_agent_version);
    v1_momentum_state := public.compute_agent_version_momentum_state(v_org_id, v_agent_id, v_agent_version);
    v1_severity := public.compute_agent_version_severity(v_org_id, v_agent_id, v_agent_version);
    v1_health_index := public.compute_agent_version_health_index(v_org_id, v_agent_id, v_agent_version);
    v1_determinism := public.compute_agent_version_determinism_check(v_org_id, v_agent_id, v_agent_version);

    -- [RUN 2]
    v2_momentum := public.compute_agent_version_momentum(v_org_id, v_agent_id, v_agent_version);
    v2_acceleration := public.compute_agent_version_acceleration(v_org_id, v_agent_id, v_agent_version);
    v2_momentum_state := public.compute_agent_version_momentum_state(v_org_id, v_agent_id, v_agent_version);
    v2_severity := public.compute_agent_version_severity(v_org_id, v_agent_id, v_agent_version);
    v2_health_index := public.compute_agent_version_health_index(v_org_id, v_agent_id, v_agent_version);
    v2_determinism := public.compute_agent_version_determinism_check(v_org_id, v_agent_id, v_agent_version);

    -- COMPARISON MATRIX
    IF (v1_momentum = v2_momentum) AND
       (v1_acceleration = v2_acceleration) AND
       (v1_momentum_state = v2_momentum_state) AND
       (v1_severity = v2_severity) AND
       (v1_health_index = v2_health_index) AND
       (v1_determinism = v2_determinism) AND
       (v1_determinism = TRUE)
    THEN
        v_final_result := 'PASS';
    END IF;

    -- FINAL REPORT
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'MOMENTUM:    % (Cycle 1) vs % (Cycle 2)', v1_momentum, v2_momentum;
    RAISE NOTICE 'ACCELERATION: % (Cycle 1) vs % (Cycle 2)', v1_acceleration, v2_acceleration;
    RAISE NOTICE 'STATE:       % (Cycle 1) vs % (Cycle 2)', v1_momentum_state, v2_momentum_state;
    RAISE NOTICE 'SEVERITY:    % (Cycle 1) vs % (Cycle 2)', v1_severity, v2_severity;
    RAISE NOTICE 'HEALTH_IDX:  % (Cycle 1) vs % (Cycle 2)', v1_health_index, v2_health_index;
    RAISE NOTICE 'DETERMINISM: % (Internal Consistency Check)', v1_determinism;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'FINAL STATUS: %', v_final_result;
    RAISE NOTICE '--------------------------------------------------';

    IF v_final_result = 'FAIL' THEN
        RAISE EXCEPTION 'DETERMINISM VIOLATION DETECTED';
    END IF;

END $$;
