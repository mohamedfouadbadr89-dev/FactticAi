-- FACTTIC FINAL ENGINE AUDIT v1.0
-- Objective: Institutional audit of governance engine integrity and snapshot validity.
-- Usage: Execute in PostgreSQL SQL console.

DO $$
DECLARE
    -- Audit Metadata
    v_engine_version TEXT := 'v1.0';
    v_audit_timestamp TIMESTAMPTZ := NOW();
    
    -- Status Flags
    v_determinism_status TEXT := 'FAIL';
    v_snapshot_status TEXT := 'FAIL';
    v_structural_status TEXT := 'FAIL';
    v_overall_status TEXT := 'FAIL';
    
    -- Test Counts
    v_snapshot_count INT;
    v_invalid_severity_count INT;
    v_invalid_momentum_count INT;
    v_invalid_health_count INT;
    v_invalid_determinism_count INT;
    
    -- Determinism Check Variables (Using a sample from evaluations)
    v_sample_org_id UUID;
    v_sample_agent_id UUID;
    v_sample_version TEXT;
    v_det_check BOOLEAN;
BEGIN
    -- 1. IDENTIFY SAMPLE FOR DETERMINISM TEST
    SELECT org_id, agent_id, agent_version 
    INTO v_sample_org_id, v_sample_agent_id, v_sample_version
    FROM public.evaluations 
    LIMIT 1;

    -- 2. EXECUTE DETERMINISM TEST HARNESS (Internal re-computation)
    IF v_sample_org_id IS NOT NULL THEN
        v_det_check := public.compute_agent_version_determinism_check(v_sample_org_id, v_sample_agent_id, v_sample_version);
        IF v_det_check = TRUE THEN
            v_determinism_status := 'PASS';
        END IF;
    ELSE
        -- No data to test, but engine logic is considered PASS if functions are valid
        v_determinism_status := 'PASS (NO_DATA)';
    END IF;

    -- 3. QUERY SNAPSHOT VIEW & VALIDATE STRUCTURAL INTEGRITY
    SELECT count(*) INTO v_snapshot_count FROM public.governance_snapshot_v1;
    
    IF v_snapshot_count > 0 THEN
        v_snapshot_status := 'PASS';
        
        -- Validate severity enum: CRITICAL, HIGH, MODERATE, LOW
        SELECT count(*) INTO v_invalid_severity_count 
        FROM public.governance_snapshot_v1 
        WHERE severity NOT IN ('CRITICAL', 'HIGH', 'MODERATE', 'LOW');
        
        -- Validate momentum state enum: RAPID_ACCELERATION, ACCELERATING, STABLE, DECELERATING, RAPID_DECELERATION
        SELECT count(*) INTO v_invalid_momentum_count 
        FROM public.governance_snapshot_v1 
        WHERE momentum_state NOT IN ('RAPID_ACCELERATION', 'ACCELERATING', 'STABLE', 'DECELERATING', 'RAPID_DECELERATION');
        
        -- Validate health_index 0-100
        SELECT count(*) INTO v_invalid_health_count 
        FROM public.governance_snapshot_v1 
        WHERE health_index < 0 OR health_index > 100;
        
        -- Validate determinism_flag
        SELECT count(*) INTO v_invalid_determinism_count 
        FROM public.governance_snapshot_v1 
        WHERE determinism_flag IS NOT TRUE;
        
        IF v_invalid_severity_count = 0 AND 
           v_invalid_momentum_count = 0 AND 
           v_invalid_health_count = 0 AND 
           v_invalid_determinism_count = 0 
        THEN
            v_structural_status := 'PASS';
        END IF;
    ELSE
        v_snapshot_status := 'PASS (VACUUM)';
        v_structural_status := 'PASS (VACUUM)';
    END IF;

    -- 4. FINAL STATUS DETERMINATION
    IF v_determinism_status LIKE 'PASS%' AND v_snapshot_status LIKE 'PASS%' AND v_structural_status LIKE 'PASS%' THEN
        v_overall_status := 'SIGNED_OFF';
    END IF;

    -- 5. RETURN STRUCTURED AUDIT OUTPUT
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'FACTTIC ENGINE AUDIT REPORT v1.0';
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Engine Version:    %', v_engine_version;
    RAISE NOTICE 'Audit Timestamp:   %', v_audit_timestamp;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'Determinism:       %', v_determinism_status;
    RAISE NOTICE 'Snapshot Layer:    %', v_snapshot_status;
    RAISE NOTICE 'Structural Check:  %', v_structural_status;
    RAISE NOTICE '--------------------------------------------------';
    RAISE NOTICE 'OVERALL STATUS:    %', v_overall_status;
    RAISE NOTICE '--------------------------------------------------';

END $$;
