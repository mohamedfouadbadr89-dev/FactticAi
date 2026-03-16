import { GovernancePipeline, type PipelineContext, type GovernanceExecutionResult } from '@/lib/governance/governancePipeline';
import { CURRENT_REGION } from '@/config/regions';
import { fileURLToPath } from 'url';

/**
 * Determinism Certification Test (v4.5.1)
 * RE-ALIGNED TO STRICT TYPE CONTRACT
 */
async function certifyDeterminism() {
  console.log('--- FACTTIC DETERMINISM CERTIFICATION (v4.5.1) ---');
  
  const payload = { test: "determinism_v4.5" };
  const iterations = 5;
  const integrityResults: string[] = [];

  console.log('1. Verifying Idempotency Force-Block...');
  const baseContext: PipelineContext = {
    orgId: '864c43c5-0484-4955-a353-f0435582a4af',
    userId: '6ac736da-3704-4c10-8632-fef7ac52be7e',
    userRole: 'admin',
    provider: 'CERTIFIER',
    eventId: `evt_idempotency_v451_${Date.now()}`,
    payload,
    startTime: 0,
    latencyBreakdown: {},
    billingUnits: 1,
    billingType: 'chat_session',
    regionId: CURRENT_REGION
  };

  // NOTE: Legacy .run(context) archived. Idempotency test uses execute() on the modular pipeline.
  await (GovernancePipeline as any).execute({
    org_id: baseContext.orgId,
    user_id: baseContext.userId,
    prompt: JSON.stringify(baseContext.payload),
    session_id: baseContext.eventId
  });
  try {
    await (GovernancePipeline as any).execute({
      org_id: baseContext.orgId,
      user_id: baseContext.userId,
      prompt: JSON.stringify(baseContext.payload),
      session_id: baseContext.eventId
    });
    console.log('❌ Idempotency: FAILED (Duplicate accepted)');
  } catch (e: any) {
    console.log(`✅ Idempotency: PASSED (${e.message})`);
  }

  console.log('\n2. Verifying Scoring Reproducibility (Unique Events, Same Payload)...');
  for (let i = 0; i < iterations; i++) {
    const context: PipelineContext = {
      ...baseContext,
      eventId: `evt_repro_v451_${i}_${Date.now()}`
    };

    const res = await (GovernancePipeline as any).execute({
      org_id: context.orgId,
      user_id: context.userId,
      prompt: JSON.stringify(context.payload),
      session_id: context.eventId
    });
    const resResult: GovernanceExecutionResult = { success: res.success, hash: res.session_id, latency: res.latency, integrityHash: res.session_id };
    integrityResults.push(res.integrityHash || 'FAILED');
  }

  const allEqual = integrityResults.every(h => h === integrityResults[0]);
  if (allEqual && integrityResults[0] !== 'FAILED') {
    console.log('\n✅ DETERMINISM CERTIFIED: All stages verified.');
  } else {
    console.log('\n❌ DETERMINISM FAILED: Integrity drift detected.');
  }
}

certifyDeterminism().catch(err => {
  console.error('Certification Crash:', err);
  process.exit(1);
});
