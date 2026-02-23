-- Level 4: Billing Deterministic Engine
-- Description: Establishes immutable billing events, aggregates, and deterministic EU calculation.

-- 1. Billing Summaries (Aggregates)
CREATE TABLE IF NOT EXISTS public.billing_summaries (
    org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    total_eu_consumed numeric(15,2) DEFAULT 0.00,
    eu_limit numeric(15,2) DEFAULT 1000.00, -- Default tier limit
    last_reset_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.billing_summaries ENABLE ROW LEVEL SECURITY;

-- 2. Billing Events (Immutable Journal)
CREATE TABLE IF NOT EXISTS public.billing_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('chat_session', 'voice_minute', 'manual_eval', 'sandbox_use')),
    units numeric(10,2) NOT NULL,
    eu_calculated numeric(10,2) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Index for performance and auditing
CREATE INDEX idx_billing_events_org ON public.billing_events(org_id);
CREATE INDEX idx_billing_events_type ON public.billing_events(type);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- SELECT: Scoped to members
CREATE POLICY "Billing summaries are viewable by organization members"
ON public.billing_summaries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = billing_summaries.org_id
        AND org_members.user_id = auth.uid()
    )
);

CREATE POLICY "Billing events are viewable by organization members"
ON public.billing_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.org_members
        WHERE org_members.org_id = billing_events.org_id
        AND org_members.user_id = auth.uid()
    )
);

-- IMMUTABILITY: NO UPDATE/DELETE allowed for anyone
CREATE POLICY "Billing events are immutable (no updates)"
ON public.billing_events FOR UPDATE
USING (false) WITH CHECK (false);

CREATE POLICY "Billing events are immutable (no deletes)"
ON public.billing_events FOR DELETE
USING (false);

-- 4. Deterministic Billing RPC
CREATE OR REPLACE FUNCTION public.record_billing_event(
    p_org_id uuid,
    p_type text,
    p_units numeric,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_eu_per_unit numeric;
    v_eu_calculated numeric;
    v_current_consumed numeric;
    v_limit numeric;
BEGIN
    -- Harden against search_path injection
    PERFORM set_config('search_path', 'public', false);

    -- 1. Validate Organization Membership
    IF NOT EXISTS (
        SELECT 1 FROM public.org_members
        WHERE user_id = auth.uid() AND org_id = p_org_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of the specified organization';
    END IF;

    -- 2. Internal EU Model Logic (Principal Directive)
    CASE p_type
        WHEN 'chat_session' THEN v_eu_per_unit := 1.0;
        WHEN 'voice_minute' THEN v_eu_per_unit := 0.2;
        WHEN 'manual_eval'  THEN v_eu_per_unit := 0.5;
        WHEN 'sandbox_use'  THEN v_eu_per_unit := 0.1;
        ELSE RAISE EXCEPTION 'Invalid billing event type: %', p_type;
    END CASE;

    v_eu_calculated := p_units * v_eu_per_unit;

    -- 3. Check Quota / Hard Cap
    SELECT total_eu_consumed, eu_limit 
    INTO v_current_consumed, v_limit
    FROM public.billing_summaries
    WHERE org_id = p_org_id
    FOR UPDATE; -- Locked for consistency

    -- Auto-initialize if missing
    IF NOT FOUND THEN
        INSERT INTO public.billing_summaries (org_id, total_eu_consumed, eu_limit)
        VALUES (p_org_id, 0.00, 1000.00)
        RETURNING total_eu_consumed, eu_limit INTO v_current_consumed, v_limit;
    END IF;

    IF (v_current_consumed + v_eu_calculated) > v_limit THEN
        RAISE EXCEPTION '402: Organization quota exceeded. Limit: %, Current: %, Requested: %', v_limit, v_current_consumed, v_eu_calculated;
    END IF;

    -- 4. Record Immutable Event
    INSERT INTO public.billing_events (
        org_id, type, units, eu_calculated, metadata
    ) VALUES (
        p_org_id, p_type, p_units, v_eu_calculated, p_metadata
    );

    -- 5. Atomic Aggregate Update
    UPDATE public.billing_summaries
    SET total_eu_consumed = total_eu_consumed + v_eu_calculated,
        updated_at = now()
    WHERE org_id = p_org_id;

    -- 6. Audit Logging
    INSERT INTO public.audit_logs (org_id, actor_id, action, metadata)
    VALUES (
        p_org_id, 
        auth.uid(), 
        'BILLING_EVENT_RECORDED', 
        jsonb_build_object(
            'type', p_type,
            'eu', v_eu_calculated,
            'total_consumed', v_current_consumed + v_eu_calculated
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'eu_consumed', v_eu_calculated,
        'remaining_quota', v_limit - (v_current_consumed + v_eu_calculated)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
