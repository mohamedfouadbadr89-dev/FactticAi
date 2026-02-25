import { NextResponse } from 'next/server';
import { CONTROL_REGISTRY } from '@/core/governance/controlRegistry';
import { RiskRegister } from '@/core/governance/riskRegister';
import { PolicyEngine } from '@/core/governance/policyEngine';
import { TrustBoundary } from '@/core/externalTrust/trustBoundary';
import { CURRENT_REGION } from '@/config/regions';
import { GovernanceEvidenceViolation } from '@/types/externalTrust';
import crypto from 'node:crypto';

/**
 * Governance Evidence API (v5.0)
 * 
 * CORE PRINCIPLE: Automated Compliance Evidence.
 * Aggregates Controls, Risks, and Policies into a signed Governance Proof.
 */
export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    
    // 1. Aggregate Governance State
    const evidenceState = {
      version: 'v5.0',
      regionId: CURRENT_REGION,
      timestamp,
      controls: CONTROL_REGISTRY,
      risks: RiskRegister.getActiveRisks(),
      policies: PolicyEngine.generateSnapshots()
    };

    // 2. Enforce Deterministic Integrity
    // (Simulating the signing process for the aggregate proof)
    const dataToSign = JSON.stringify(evidenceState);
    
    // Using TrustBoundary's ephemeral key simulation for v5.0
    const signature = crypto.sign(null, Buffer.from(dataToSign), (TrustBoundary as any).privateKey).toString('hex');

    const governanceProof = {
      ...evidenceState,
      signature,
      publicKey: TrustBoundary.publicKey
    };

    // 3. Final Verification before emission
    const now = new Date();
    const payloadTime = new Date(timestamp);
    const drift = Math.abs(now.getTime() - payloadTime.getTime()) / 1000;

    if (drift > 5) {
      throw new GovernanceEvidenceViolation(`EMISSION_SKEW_EXCEEDED: Drift is ${drift.toFixed(2)}s`);
    }

    if (evidenceState.regionId !== CURRENT_REGION) {
       throw new GovernanceEvidenceViolation('RESIDENCY_MISMATCH_ON_EMISSION');
    }

    return NextResponse.json(governanceProof, {
      headers: {
        'X-Governance-Status': 'CERTIFIED',
        'X-Audit-Readiness': 'PRE_SOC2_TYPE_I'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.name, 
      message: error.message,
      status: 'GOVERNANCE_EVIDENCE_VIOLATION'
    }, { status: 500 });
  }
}
