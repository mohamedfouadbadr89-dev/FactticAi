-- Migration: Phase 45 Voice Stream Telemetry
-- Per-session voice quality metrics for real-time monitoring

CREATE TABLE public.voice_stream_metrics (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.organizations(id) on delete cascade,
    session_id text not null,
    latency_ms numeric(8,2) not null default 0 CHECK (latency_ms >= 0),
    packet_loss numeric(5,2) not null default 0 CHECK (packet_loss BETWEEN 0 AND 100),
    interruptions integer not null default 0 CHECK (interruptions >= 0),
    audio_integrity_score numeric(5,2) not null default 100 CHECK (audio_integrity_score BETWEEN 0 AND 100),
    created_at timestamp with time zone default now() not null
);

CREATE INDEX idx_voice_metrics_org_id     ON public.voice_stream_metrics(org_id);
CREATE INDEX idx_voice_metrics_session_id ON public.voice_stream_metrics(session_id);
CREATE INDEX idx_voice_metrics_created_at ON public.voice_stream_metrics(created_at DESC);

ALTER TABLE public.voice_stream_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can read their own voice metrics"
    ON public.voice_stream_metrics FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Engine can insert voice metrics"
    ON public.voice_stream_metrics FOR INSERT
    WITH CHECK (true);
