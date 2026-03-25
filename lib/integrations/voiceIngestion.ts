import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceProvider =
  | 'vapi'
  | 'retell'
  | 'elevenlabs'
  | 'pipecat'
  | 'openai_realtime'
  | 'anthropic_agents'

export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface NormalizedPayload {
  provider: VoiceProvider
  session_id: string
  messages: NormalizedMessage[]
  metadata: Record<string, unknown>
}

// ── Signature Verification ───────────────────────────────────────────────────

/**
 * Verify HMAC-SHA256 webhook signature.
 * Each provider has a slightly different header / encoding convention.
 */
export function verifySignature(
  provider: VoiceProvider,
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(rawBody, 'utf8')
    const expected = hmac.digest('hex')

    // Retell and ElevenLabs prefix with "sha256="
    const normalized =
      signature.startsWith('sha256=') ? signature.slice(7) : signature

    return crypto.timingSafeEqual(
      Buffer.from(normalized, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

// ── Provider Normalization ───────────────────────────────────────────────────

function normalizeVapi(body: any): NormalizedPayload {
  const messages: NormalizedMessage[] = (body.messages ?? []).map((m: any) => ({
    role: m.role === 'bot' ? 'assistant' : m.role,
    content: m.message ?? m.content ?? '',
    timestamp: m.time ?? undefined,
  }))
  return {
    provider: 'vapi',
    session_id: body.call?.id ?? body.callId ?? crypto.randomUUID(),
    messages,
    metadata: { duration: body.call?.duration, endedReason: body.endedReason },
  }
}

function normalizeRetell(body: any): NormalizedPayload {
  const messages: NormalizedMessage[] = (body.transcript ?? []).map((m: any) => ({
    role: m.role === 'agent' ? 'assistant' : 'user',
    content: m.content ?? '',
    timestamp: m.words?.[0]?.start?.toString(),
  }))
  return {
    provider: 'retell',
    session_id: body.call_id ?? crypto.randomUUID(),
    messages,
    metadata: { callStatus: body.call_status, disconnectionReason: body.disconnection_reason },
  }
}

function normalizeElevenLabs(body: any): NormalizedPayload {
  const messages: NormalizedMessage[] = (body.conversation_history ?? []).map((m: any) => ({
    role: m.role === 'agent' ? 'assistant' : 'user',
    content: m.message ?? '',
  }))
  return {
    provider: 'elevenlabs',
    session_id: body.conversation_id ?? crypto.randomUUID(),
    messages,
    metadata: { agentId: body.agent_id, status: body.status },
  }
}

function normalizeOpenAIRealtime(body: any): NormalizedPayload {
  const messages: NormalizedMessage[] = (body.items ?? [])
    .filter((i: any) => i.type === 'message')
    .map((i: any) => ({
      role: i.role,
      content: i.content?.[0]?.transcript ?? i.content?.[0]?.text ?? '',
    }))
  return {
    provider: 'openai_realtime',
    session_id: body.session?.id ?? crypto.randomUUID(),
    messages,
    metadata: { model: body.session?.model },
  }
}

function normalizeAnthropic(body: any): NormalizedPayload {
  const messages: NormalizedMessage[] = (body.messages ?? []).map((m: any) => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : m.content?.[0]?.text ?? '',
  }))
  return {
    provider: 'anthropic_agents',
    session_id: body.session_id ?? body.id ?? crypto.randomUUID(),
    messages,
    metadata: { model: body.model, stopReason: body.stop_reason },
  }
}

function normalizePipecat(body: any): NormalizedPayload {
  const messages: NormalizedMessage[] = (body.transcript || body.messages || []).map((m: any) => ({
    role: m.role || (m.speaker === 'agent' ? 'assistant' : 'user'),
    content: m.content || m.text || '',
    timestamp: m.timestamp,
  }))
  return {
    provider: 'pipecat',
    session_id: body.session_id || body.call_id || crypto.randomUUID(),
    messages,
    metadata: { ...body.metadata, pipecat_version: body.version },
  }
}

export function normalizePayload(
  provider: VoiceProvider,
  body: any
): NormalizedPayload {
  switch (provider) {
    case 'vapi':              return normalizeVapi(body)
    case 'retell':            return normalizeRetell(body)
    case 'elevenlabs':        return normalizeElevenLabs(body)
    case 'pipecat':           return normalizePipecat(body)
    case 'openai_realtime':   return normalizeOpenAIRealtime(body)
    case 'anthropic_agents':  return normalizeAnthropic(body)
  }
}

// ── Ingestion Pipeline ───────────────────────────────────────────────────────

/**
 * Persist the normalized conversation and forward it into the evaluation pipeline.
 * Returns the internal session ID.
 */
export async function ingestConversation(
  payload: NormalizedPayload,
  orgId: string
): Promise<{ session_id: string; message_count: number }> {
  // 1. Upsert the voice session record
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .upsert({
      id: payload.session_id,
      org_id: orgId,
      status: 'completed',
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    // Log non-blocking — still attempt pipeline forward
    console.warn('[VoiceIngestion] Session upsert warning:', sessionError?.message)
  }

  const internalSessionId = session?.id ?? payload.session_id

  // 2. Batch-insert messages
  if (payload.messages.length > 0 && session?.id) {
    const rows = payload.messages.map((m, idx) => ({
      session_id: session.id,
      role: m.role,
      content: m.content,
      sequence: idx,
      created_at: m.timestamp ?? new Date().toISOString(),
    }))

    const { error: msgError } = await supabase.from('session_messages').insert(rows)
    if (msgError) {
      console.warn('[VoiceIngestion] Message insert warning:', msgError.message)
    }
  }

  // 3. Forward to governance evaluation pipeline (fire-and-forget)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    void fetch(`${baseUrl}/api/governance/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
      body: JSON.stringify({ session_id: internalSessionId, org_id: orgId }),
    })
  } catch (e) {
    console.warn('[VoiceIngestion] Pipeline forward warning:', e)
  }

  return { session_id: internalSessionId, message_count: payload.messages.length }
}

// ── Integration Config Lookup ────────────────────────────────────────────────

export async function getIntegrationSecret(
  orgId: string,
  provider: VoiceProvider
): Promise<string | null> {
  const { data } = await supabase
    .from('external_integrations')
    .select('webhook_secret')
    .eq('org_id', orgId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single()
  return data?.webhook_secret ?? null
}
