import { Worker } from 'bullmq';
import { EvidenceLedger } from '../lib/evidence/evidenceLedger';
import { supabaseServer } from '../lib/supabaseServer';
import { redactPII } from '../lib/security/redactPII';
import crypto from 'crypto';
import zlib from 'zlib';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

// ── Redis Latency Detection ────────────────────────────────────────────────
// Protection against Split-Brain or high network jitter.
let lastRedisLatency = 0;
// ─────────────────────────────────────────────────────────────────────────────

// ── Circuit Breaker State ──────────────────────────────────────────────────
let consecutiveDbFailures = 0;
const BREAKER_THRESHOLD = 50;
const BREAKER_PAUSE_MS = 30000;

export const governanceWorker = new Worker('governance_event_job', async (job) => {
  const startProcessing = performance.now();

  // 1. GZIP Decompression 
  let jobData = job.data;
  if (jobData.compressed) {
    const buffer = Buffer.from(jobData.payload, 'base64');
    const decompressed = zlib.gunzipSync(buffer);
    jobData = JSON.parse(decompressed.toString());
  }

  const { payload, signature } = jobData;

  // ── Payload Integrity Verification ────────────────────────────────────────
  const secret = process.env.GOVERNANCE_SECRET;
  if (!secret) {
    throw new Error('CRITICAL_SECURITY_FAILURE: GOVERNANCE_SECRET must be configured to verify async payloads.');
  }

  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error(`[Security] Payload signature mismatch for job ${job.id}. Target may have been tampered with.`);
    await supabaseServer.from('audit_logs').insert({
      org_id: payload.org_id,
      action: 'QUEUE_PAYLOAD_TAMPERED',
      metadata: { job_id: job.id, expected: expectedSignature, actual: signature }
    });
    throw new Error('QUEUE_PAYLOAD_TAMPERED');
  }

  const { 
    session_id, 
    org_id, 
    decision, 
    risk_score, 
    metadata 
  } = payload;

  try {
    // ── Asynchronous Persistence Boundary ───────────────────────────────────
    // The raw prompt was passed from the fast-path pipeline. Here in the
    // background worker, we run the heavy regex stripping (redactPII) over
    // potentially large prompt strings without blocking the main event loop.
    const sanitizedPrompt = metadata.prompt ? redactPII(metadata.prompt) : undefined;
    
    // 1. Evidence Ledger / append_governance_ledger()
    const ledgerResult = await EvidenceLedger.write({
      org_id,
      session_id,
      event_type: metadata.event_type || 'governance_evaluation',
      decision,
      risk_score,
      prompt: sanitizedPrompt,
      model: metadata.model,
      guardrail_signals: metadata.guardrail_signals || {},
      violations: metadata.violations || [],
      latency: metadata.latency || 0,
      queue_job_id: job.id
    });

    // 2. Forensic Events: Apply metadata / voice modifiers to the ledger event
    if (metadata.voice_modifiers && Object.keys(metadata.voice_modifiers).length > 0) {
      // Apply the redacted metadata update to the row (EvidenceLedger.write creates the row first to prevent race condition)
      await supabaseServer.from('facttic_governance_events')
        .update({ metadata: redactPII(metadata.voice_modifiers) })
        .eq('event_id', ledgerResult.event_id)
        .or(`id.eq.${ledgerResult.event_id}`);
    }

    // 2.5 Incident Persistence
    if (metadata.incident && metadata.incident.create_incident) {
      await supabaseServer.from('incidents').insert({
          org_id,
          session_id,
          severity: metadata.incident.severity,
          violation_type: metadata.incident.incident_type,
          timestamp: new Date().toISOString()
      });
    }

    // 3. Audit Log Recording
    await supabaseServer.from('audit_logs').insert({
      org_id,
      action: 'GOVERNANCE_EXECUTION',
      metadata: redactPII({
        processing_ms: metadata.latency,
        model: metadata.model,
        decision,
        risk_score,
        session_id,
        user_id: metadata.user_id,
        worker_id: job.id
      })
    });

    // 4. Observability Broadcast
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          messages: [{
            topic: `governance:${org_id}`,
            event: 'governance_event',
            payload: { session_id, decision, risk_score, timestamp: Date.now() }
          }]
        })
      }).catch(err => console.error('[Worker Broadcast Error]', err));
    }

    // ── Fix 1: Redis Stability Monitoring ──────────────────────────────────
    // Record processing duration as a proxy for connection health.
    lastRedisLatency = performance.now() - startProcessing;
    if (lastRedisLatency > 250) {
      console.warn(`[RedisHealth] High latency detected (${Math.round(lastRedisLatency)}ms). Adaptive throttle engaged.`);
      // Force an artificial delay to effectively reduce concurrency and 
      // prevent partition-induced CPU storms.
      await new Promise(r => setTimeout(r, 500));
    }

    return { success: true, event_id: ledgerResult.event_id };
  } catch (err: any) {
    console.error(`[GovernanceWorker] Job ${job.id} failed:`, err);
    throw err;
  }
}, { 
  connection,
  concurrency: 20 // Standard concurrency. Throttling is handled dynamically inside the processor.
});

governanceWorker.on('completed', (job) => {
  console.log(`[GovernanceWorker] Job ${job.id} completed successfully`);
  consecutiveDbFailures = 0; // Reset circuit breaker counter on success
});

governanceWorker.on('failed', async (job, err) => {
  console.error(`[GovernanceWorker] Job ${job?.id} failed with ${err.message}`);
  
  // ── Circuit Breaker Execution ───────────────────────────────────────────
  consecutiveDbFailures++;
  if (consecutiveDbFailures >= BREAKER_THRESHOLD) {
    if (!governanceWorker.isPaused()) {
      console.error('QUEUE_CIRCUIT_BREAKER_TRIGGERED');
      
      try { 
        governanceWorker.pause(); 
      } catch (pauseErr) {
        console.error('[CircuitBreaker] Failed to pause:', pauseErr);
      }
      
      setTimeout(() => {
        console.log('[CircuitBreaker] Resuming governanceWorker polling...');
        try {
          governanceWorker.resume();
        } catch (resumeErr) {
          console.error('[CircuitBreaker] Failed to resume:', resumeErr);
        }
      }, BREAKER_PAUSE_MS);
    }
    // Prevent immediate re-triggering while paused
    consecutiveDbFailures = 0; 
  }
  
  // If the job has exhausted all of its configured retries (5)
  if (job && job.attemptsMade === job.opts.attempts) {
    try {
      // ── Handle Compressed and Uncompressed Payloads ──
      let data = job.data;
      if (data.compressed) {
        const buffer = Buffer.from(data.payload, 'base64');
        data = JSON.parse(zlib.gunzipSync(buffer).toString());
      }

      await supabaseServer.from('governance_failed_jobs').insert({
        session_id: data.payload.session_id,
        org_id: data.payload.org_id,
        payload: data.payload,
        signature: data.signature,
        error_message: err.message
      });
      console.error(`[GovernanceWorker] Job ${job.id} EXHAUSTED fully. Moved to Dead Letter Queue (governance_failed_jobs).`);
    } catch (dlqErr) {
      console.error(`[GovernanceWorker] CRITICAL: Failed to write to Dead Letter Queue:`, dlqErr);
    }
  }
});
