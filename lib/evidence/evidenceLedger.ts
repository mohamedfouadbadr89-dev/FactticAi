/**
 * Facttic Evidence Ledger (v2.0 — Tamper-Evident Hash Chain)
 *
 * Writes every governance execution to `facttic_governance_events` as an
 * append-only, cryptographically linked chain. Each event is:
 *
 *   1. Hashed with SHA-256 over (session_id + timestamp + prompt + decision
 *      + risk_score + violations + previous_hash)
 *   2. Signed with HMAC-SHA256 over the event_hash using the org's secret
 *   3. Linked to the previous event via previous_hash
 *
 * Integrity verification recomputes both the hash and signature for every
 * event in the chain, identifying the exact record and failure type when
 * tampering is detected.
 */

import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'
import { createHash, createHmac } from 'crypto'
import { AlertEngine } from '../alerts/alertEngine'

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface GovernanceEvent {
  session_id: string
  org_id: string
  event_type?: string
  prompt?: string | null
  model?: string
  decision: string
  risk_score: number
  violations?: any[]
  guardrail_signals?: any
  latency?: number
  model_response?: string | null
}

export interface LedgedEvent extends GovernanceEvent {
  id: string
  timestamp: number
  event_hash: string
  previous_hash: string
  signature: string
}

/** Discriminated union of failure types — each maps to a distinct attack vector. */
export type IntegrityStatus =
  | 'VALID'               // All events pass hash, chain, and signature checks
  | 'CHAIN_BROKEN'        // previous_hash mismatch — event inserted or deleted
  | 'HASH_MISMATCH'       // Recomputed hash ≠ stored hash — field-level data tampering
  | 'SIGNATURE_INVALID'   // HMAC mismatch — event_hash modified after signing
  | 'EMPTY_SESSION'       // No events found for this session
  | 'FETCH_ERROR'         // Database query failed

/** Precise forensic classification of how tampering occurred. */
export type TamperType =
  | 'INSERTION_OR_DELETION'   // Chain link broken — a block was added or removed
  | 'FIELD_LEVEL_MUTATION'    // Hash mismatch — stored fields differ from at-write values
  | 'HASH_LEVEL_MUTATION'     // Signature mismatch — event_hash itself was overwritten
  | null

export interface LedgerIntegrityResult {
  integrity_status: IntegrityStatus
  session_id: string
  chain_length: number
  /** Number of events that passed all three checks before the failure */
  verified_events: number
  /** UUID of the first event that failed verification; null when VALID */
  broken_event_id: string | null
  /** Human-readable explanation of the failure; null when VALID */
  failure_reason: string | null
  /** Precise classification of the tampering method; null when VALID */
  tamper_type: TamperType
  verified_at: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Private crypto primitives
// ─────────────────────────────────────────────────────────────────────────────

interface HashFields {
  session_id: string
  timestamp: number | string
  prompt: string | null | undefined
  decision: string
  risk_score: number
  violations: any[] | null | undefined
  previous_hash: string
}

/**
 * Deterministic hash input string.
 * The field ordering here is canonical — changing it breaks all existing chains.
 */
function buildHashInput(fields: HashFields): string {
  return (
    fields.session_id +
    fields.timestamp +
    (fields.prompt || '') +
    fields.decision +
    fields.risk_score +
    JSON.stringify(fields.violations || []) +
    fields.previous_hash
  )
}

/** Recomputes SHA-256 event hash from raw fields. */
function computeEventHash(fields: HashFields): string {
  return createHash('sha256').update(buildHashInput(fields)).digest('hex')
}

/**
 * HMAC-SHA256 signature over the event_hash.
 * Binds the hash to the org secret — tampering the hash invalidates the signature.
 */
function computeSignature(eventHash: string, orgId: string): string {
  const secret =
    process.env.GOVERNANCE_SECRET ||
    process.env.TELEMETRY_SECRET ||
    `facttic_integrity_fallback_${orgId}`

  return createHmac('sha256', secret).update(eventHash).digest('hex')
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyLedgerIntegrity — exported standalone function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cryptographically verifies the full event chain for a session.
 *
 * For each event in chronological order:
 *   1. Chain check      — previous_hash must equal the prior event's event_hash
 *   2. Replay check     — recompute SHA-256 from raw fields; must match stored event_hash
 *   3. Signature check  — recompute HMAC; must match stored signature (if column present)
 *
 * Stops at the first failure and returns the exact event ID and tamper type.
 */
export async function verifyLedgerIntegrity(
  session_id: string,
  org_id?: string
): Promise<LedgerIntegrityResult> {
  const verified_at = new Date().toISOString()

  const { data: events, error } = await supabaseServer
    .from('facttic_governance_events')
    .select('id, session_id, org_id, timestamp, prompt, decision, risk_score, violations, previous_hash, event_hash, signature')
    .eq('session_id', session_id)
    .order('timestamp', { ascending: true })

  if (error) {
    logger.error('INTEGRITY_FETCH_FAILED', { session_id, error: error.message })
    return {
      integrity_status: 'FETCH_ERROR',
      session_id,
      chain_length: 0,
      verified_events: 0,
      broken_event_id: null,
      failure_reason: `Database query failed: ${error.message}`,
      tamper_type: null,
      verified_at,
    }
  }

  if (!events || events.length === 0) {
    return {
      integrity_status: 'EMPTY_SESSION',
      session_id,
      chain_length: 0,
      verified_events: 0,
      broken_event_id: null,
      failure_reason: null,
      tamper_type: null,
      verified_at,
    }
  }

  let expectedPrevHash = 'GENESIS_HASH'
  let verifiedEvents = 0
  const resolvedOrgId = org_id || events[0]?.org_id || ''

  for (const event of events) {

    // ── Check 1: Chain linkage ──────────────────────────────────────────────
    // Detects inserted or deleted blocks — a gap or extra event breaks the
    // previous_hash pointer that links each block to its predecessor.
    if (event.previous_hash !== expectedPrevHash) {
      logger.warn('INTEGRITY_CHAIN_BROKEN', {
        session_id,
        event_id: event.id,
        expected: expectedPrevHash.substring(0, 8),
        actual: event.previous_hash?.substring(0, 8),
      })
      return {
        integrity_status: 'CHAIN_BROKEN',
        session_id,
        chain_length: events.length,
        verified_events: verifiedEvents,
        broken_event_id: event.id,
        failure_reason:
          `Chain link broken at event ${event.id}. ` +
          `Expected previous_hash ${expectedPrevHash.substring(0, 8)}…, ` +
          `found ${event.previous_hash?.substring(0, 8)}….`,
        tamper_type: 'INSERTION_OR_DELETION',
        verified_at,
      }
    }

    // ── Check 2: Replay hash verification ──────────────────────────────────
    // Detects field-level mutations — any stored field (prompt, decision,
    // risk_score, violations) was changed after the event was written.
    const recomputedHash = computeEventHash({
      session_id: event.session_id,
      timestamp: event.timestamp,
      prompt: event.prompt,
      decision: event.decision,
      risk_score: event.risk_score,
      violations: event.violations,
      previous_hash: event.previous_hash,
    })

    if (recomputedHash !== event.event_hash) {
      logger.warn('INTEGRITY_HASH_MISMATCH', {
        session_id,
        event_id: event.id,
        stored: event.event_hash?.substring(0, 8),
        recomputed: recomputedHash.substring(0, 8),
      })
      return {
        integrity_status: 'HASH_MISMATCH',
        session_id,
        chain_length: events.length,
        verified_events: verifiedEvents,
        broken_event_id: event.id,
        failure_reason:
          `Hash mismatch at event ${event.id}. ` +
          `Stored hash ${event.event_hash?.substring(0, 8)}… does not match ` +
          `recomputed hash ${recomputedHash.substring(0, 8)}….`,
        tamper_type: 'FIELD_LEVEL_MUTATION',
        verified_at,
      }
    }

    // ── Check 3: HMAC signature verification ───────────────────────────────
    // Detects hash-level mutations — an attacker who edits a field AND
    // correctly recomputes the SHA-256 hash still cannot forge the HMAC
    // without knowing the org secret.
    if (event.signature) {
      const expectedSignature = computeSignature(event.event_hash, resolvedOrgId)
      if (expectedSignature !== event.signature) {
        logger.warn('INTEGRITY_SIGNATURE_INVALID', { session_id, event_id: event.id })
        return {
          integrity_status: 'SIGNATURE_INVALID',
          session_id,
          chain_length: events.length,
          verified_events: verifiedEvents,
          broken_event_id: event.id,
          failure_reason:
            `HMAC signature invalid at event ${event.id}. ` +
            `The event_hash was modified after the block was signed.`,
          tamper_type: 'HASH_LEVEL_MUTATION',
          verified_at,
        }
      }
    }

    expectedPrevHash = event.event_hash
    verifiedEvents++
  }

  logger.info('INTEGRITY_VERIFIED', {
    session_id,
    chain_length: events.length,
    verified_events: verifiedEvents,
  })

  return {
    integrity_status: 'VALID',
    session_id,
    chain_length: events.length,
    verified_events: verifiedEvents,
    broken_event_id: null,
    failure_reason: null,
    tamper_type: null,
    verified_at,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EvidenceLedger
// ─────────────────────────────────────────────────────────────────────────────

export const EvidenceLedger = {

  // ── write ─────────────────────────────────────────────────────────────────

  async write(event: GovernanceEvent): Promise<{
    event_id: string
    session_id: string
    event_hash: string
    previous_hash: string
    signature: string
  }> {
    try {

      /**
       * 1. Fetch previous event_hash to form the chain link.
       *    Falls back to 'GENESIS_HASH' for the first event in a session.
       */
      const { data: prevEvents, error: fetchError } = await supabaseServer
        .from('facttic_governance_events')
        .select('event_hash')
        .eq('session_id', event.session_id)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      const previousHash =
        prevEvents && prevEvents.length > 0
          ? prevEvents[0].event_hash
          : 'GENESIS_HASH'

      /**
       * 2. Timestamp as BIGINT (unix-ms) — ordering key and chain input.
       */
      const timestamp = Date.now()

      /**
       * 3. SHA-256 event hash over all fields that form the ledger record.
       *    Formula: SHA256(session_id + timestamp + prompt + decision
       *                    + risk_score + violations + previous_hash)
       */
      const eventHash = computeEventHash({
        session_id: event.session_id,
        timestamp,
        prompt: event.prompt,
        decision: event.decision,
        risk_score: event.risk_score,
        violations: event.violations,
        previous_hash: previousHash,
      })

      /**
       * 4. HMAC-SHA256 signature over the event_hash.
       *    Binds the hash to the org secret — any post-write modification
       *    of event_hash will fail the signature check even if the attacker
       *    correctly recomputes the SHA-256.
       */
      const signature = computeSignature(eventHash, event.org_id)

      /**
       * 5. Persist the tamper-evident record.
       */
      const { data, error } = await supabaseServer
        .from('facttic_governance_events')
        .insert({
          session_id:        event.session_id,
          org_id:            event.org_id,
          timestamp,
          event_type:        event.event_type || 'governance_decision',
          prompt:            event.prompt || null,
          model:             event.model || 'unspecified',
          decision:          event.decision,
          risk_score:        event.risk_score,
          violations:        event.violations || [],
          guardrail_signals: event.guardrail_signals || {},
          latency:           event.latency || 0,
          model_response:    event.model_response || null,
          event_hash:        eventHash,
          previous_hash:     previousHash,
          signature,
        })
        .select('id')
        .single()

      if (error) throw error

      return {
        event_id:      data.id,
        session_id:    event.session_id,
        event_hash:    eventHash,
        previous_hash: previousHash,
        signature:     signature
      }

    } catch (err: any) {
      throw err
    }
  },

  // ── readSession ───────────────────────────────────────────────────────────

  /**
   * Reads and cryptographically validates the full event chain for a session.
   * Throws on the first integrity failure with the event ID embedded in the
   * error message. Use verifyLedgerIntegrity for non-throwing structured results.
   */
  async readSession(sessionId: string): Promise<LedgedEvent[]> {
    const { data, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return []

    let expectedPrevHash = 'GENESIS_HASH'

    for (const event of data) {
      if (event.previous_hash !== expectedPrevHash) {
        throw new Error(`LEDGER_CHAIN_BROKEN at event ${event.id}`)
      }

      const recomputed = computeEventHash({
        session_id:    event.session_id,
        timestamp:     event.timestamp,
        prompt:        event.prompt,
        decision:      event.decision,
        risk_score:    event.risk_score,
        violations:    event.violations,
        previous_hash: event.previous_hash,
      })

      if (recomputed !== event.event_hash) {
        throw new Error(`LEDGER_DATA_TAMPERED at event ${event.id}`)
      }

      expectedPrevHash = event.event_hash
    }

    return data as LedgedEvent[]
  },

  // ── verifyLedgerIntegrity ─────────────────────────────────────────────────

  /**
   * Non-throwing structured integrity verification.
   * Returns the exact broken event ID and tamper type on failure.
   *
   * Runs three checks per event:
   *   1. Chain linkage  — previous_hash pointer continuity
   *   2. Replay hash    — SHA-256 recomputation from raw fields
   *   3. HMAC signature — org-secret-bound signature over event_hash
   */
  verifyLedgerIntegrity,

  // ── replayValidation ─────────────────────────────────────────────────────

  /**
   * Point-in-time verification of a single event without walking the full chain.
   * Useful for confirming a specific event's integrity during incident review.
   */
  async replayValidation(eventId: string): Promise<{
    event_id: string
    stored_hash: string
    recomputed_hash: string
    hash_valid: boolean
    signature_valid: boolean | null
    org_id: string
  } | null> {
    const { data: event, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, session_id, org_id, timestamp, prompt, decision, risk_score, violations, previous_hash, event_hash, signature')
      .eq('id', eventId)
      .single()

    if (error || !event) {
      logger.warn('REPLAY_VALIDATION_NOT_FOUND', { eventId })
      return null
    }

    const recomputedHash = computeEventHash({
      session_id:    event.session_id,
      timestamp:     event.timestamp,
      prompt:        event.prompt,
      decision:      event.decision,
      risk_score:    event.risk_score,
      violations:    event.violations,
      previous_hash: event.previous_hash,
    })

    const hash_valid = recomputedHash === event.event_hash

    let signature_valid: boolean | null = null
    if (event.signature) {
      signature_valid = computeSignature(event.event_hash, event.org_id) === event.signature
    }

    logger.info('REPLAY_VALIDATION_COMPLETE', { event_id: eventId, hash_valid, signature_valid })

    return {
      event_id:        event.id,
      stored_hash:     event.event_hash,
      recomputed_hash: recomputedHash,
      hash_valid,
      signature_valid,
      org_id:          event.org_id,
    }
  },
}
