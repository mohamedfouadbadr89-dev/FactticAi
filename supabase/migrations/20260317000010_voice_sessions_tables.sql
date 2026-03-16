-- Voice Sessions, Metrics, Transcripts, and Stream Events
-- Required by /dashboard/voice page

-- 1. voice_sessions
CREATE TABLE IF NOT EXISTS public.voice_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id      UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  provider      TEXT NOT NULL DEFAULT 'unknown',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_org ON public.voice_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created ON public.voice_sessions(created_at DESC);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_sessions_org_select" ON public.voice_sessions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );
CREATE POLICY "voice_sessions_service_insert" ON public.voice_sessions
  FOR INSERT WITH CHECK (true);

-- 2. voice_metrics (per session)
CREATE TABLE IF NOT EXISTS public.voice_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id      UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  latency_ms            NUMERIC NOT NULL DEFAULT 0,
  packet_loss           NUMERIC NOT NULL DEFAULT 0,
  interruptions         INTEGER NOT NULL DEFAULT 0,
  audio_integrity_score NUMERIC NOT NULL DEFAULT 100,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_metrics_session ON public.voice_metrics(voice_session_id);

ALTER TABLE public.voice_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_metrics_select" ON public.voice_metrics FOR SELECT USING (true);
CREATE POLICY "voice_metrics_insert" ON public.voice_metrics FOR INSERT WITH CHECK (true);

-- 3. voice_transcripts (per session)
CREATE TABLE IF NOT EXISTS public.voice_transcripts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  transcript       TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_transcripts_session ON public.voice_transcripts(voice_session_id);

ALTER TABLE public.voice_transcripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_transcripts_select" ON public.voice_transcripts FOR SELECT USING (true);
CREATE POLICY "voice_transcripts_insert" ON public.voice_transcripts FOR INSERT WITH CHECK (true);

-- 4. voice_stream_events (live chunk stream)
CREATE TABLE IF NOT EXISTS public.voice_stream_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_session_id  UUID REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
  org_id            UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  speaker           TEXT NOT NULL DEFAULT 'agent' CHECK (speaker IN ('agent', 'user')),
  start_ms          INTEGER NOT NULL DEFAULT 0,
  end_ms            INTEGER NOT NULL DEFAULT 0,
  transcript_delta  TEXT NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_stream_org ON public.voice_stream_events(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_stream_created ON public.voice_stream_events(created_at DESC);

ALTER TABLE public.voice_stream_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "voice_stream_select" ON public.voice_stream_events FOR SELECT USING (true);
CREATE POLICY "voice_stream_insert" ON public.voice_stream_events FOR INSERT WITH CHECK (true);
